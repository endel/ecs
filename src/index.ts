import { Schema, ArraySchema, type, MapSchema } from "@colyseus/schema";

import {
    World as EcsyWorld,
    WorldOptions,
    _Entity as EcsyEntity,
    Component as EcsyComponent,
    TagComponent as EcsyTagComponent,
    System,
    Types,
} from "ecsy";

import { TYPE_MAP } from "./types";
import { applyMixins, getEcsyTypeFromSchema } from "./utils";

// Combine Schema + EcsyComponent
export interface Component<C = any> extends Schema, EcsyComponent<C> { };
export class Component<C> extends Schema {
    static schema: any = {};
    static isComponent: true = true;

    // alias ECSY's _typeId to @colyseus/schema's _typeid
    static get _typeId() { return (this as typeof Schema)._typeid; }
    static set _typeId(typeId: any) {/* ignore */}

    reset() {
        EcsyComponent.prototype.reset.call(this);
        // clear refId to ensure a new one is going to be assigned
        this['$changes'].refId = undefined;
    }
}

export interface TagComponent<C = any> extends Schema, EcsyTagComponent { };
export class TagComponent extends Component {
    static isTagComponent = true;
}

//
// Copy Ecsy's Component methods into Schema prototype
// (Schema already implements .clone())
//
applyMixins(Component, [EcsyComponent]);

export interface Entity extends Schema, EcsyEntity { };
export class Entity extends Schema {
    id: number;
    alive: boolean;

    @type({ map: Component }) components = new MapSchema<Component>();

    constructor (entityManager?: any) {
        super();

        //
        // FIXME: when decoding, we don't have access to the `entityManager` at this point yet.
        //
        if (entityManager) {
            // @ts-ignore
            this._entityManager = entityManager || null;

            // Unique ID for this entity
            this.id = entityManager._nextEntityId++;
        }

        // List of components types the entity has
        // @ts-ignore
        this._ComponentTypes = [];

        // Instance of the components
        // @ts-ignore
        this._components = this.components;

        // @ts-ignore
        this._componentsToRemove = {};

        // Queries where the entity is added
        // @ts-ignore
        this.queries = [];

        // Used for deferred removal
        // @ts-ignore
        this._ComponentTypesToRemove = [];

        this.alive = false;

        //if there are state components on a entity, it can't be removed completely
        // @ts-ignore
        this.numStateComponents = 0;
    }
}

//
// Copy Ecsy's Entity methods into our Entity class
//
applyMixins(Entity, [EcsyEntity]);

export class State extends Schema {
    @type([Entity]) entities = new ArraySchema<Entity>();
}

export class World extends EcsyWorld {
    constructor(options: WorldOptions = {}) {
        if (!options.entityClass) {
            // Use built-in Entity if none were specified.
            options.entityClass = Entity;
        }

        super(options);
    }

    useEntities(entities: Entity[]) {
        this['entityManager']._entities = entities;

        //
        // When called from the client-side (browser)
        // Enable auto decoding of entities.
        // - Automatically assign entities into the World
        // - Automatically assign components into the entities.
        //
        if (
            typeof global['window'] !== 'undefined' &&
            typeof global['window'].document !== 'undefined'
        ) {
            this.enableAutoDecoding(entities as any);
        }

        return this;
    }

    enableAutoDecoding(entities: ArraySchema<Entity>) {
        const entityManager = this['entityManager'];
        const componentsManager = this['componentsManager']

        entities.onAdd = (entity: Entity, index: number) => {
            entity.alive = true;

            entity.components.onAdd = function (component, key) {
                const ComponentType = component.constructor as typeof Schema;

                entity['_ComponentTypes'].push(ComponentType);
                entity['_components'][ComponentType._typeid] = component;

                entityManager._queryManager.onEntityComponentAdded(entity, ComponentType);
                componentsManager.componentAddedToEntity(ComponentType);

                // TODO: improve me.
                entityManager.eventDispatcher.dispatchEvent('EntityManager#COMPONENT_ADDED', entity, ComponentType);
            }

            entity.components.onRemove = function () {
                // TODO: trigger component removal?
            }
        }
    }

    // @ts-ignore
    registerComponent(...args: any[]) {
        const ecsySchema = {};
        const schema = args[0]._definition?.schema || {};

        for (const field in schema) {
            const schemaType = schema[field];

            let type: any;

            switch (typeof(schemaType)) {
                case "string":
                    type = TYPE_MAP[schemaType];
                    break;

                case "function":
                    if (schemaType._definition) {
                        //
                        // Get custom ECSY type from schema child.
                        //
                        type = getEcsyTypeFromSchema(schemaType);

                    } else {
                        type = Types.Ref;
                    }
                    break;

                case "object":
                    type = (schemaType.array)
                        ? Types.Array
                        : Types.JSON;
                    break;
            }

            ecsySchema[field] = { type };
        }

        args[0].schema = ecsySchema;

        // @ts-ignore
        return super.registerComponent(...args);
    }
}

export { System };