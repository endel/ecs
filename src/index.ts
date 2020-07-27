import { Schema, ArraySchema, type } from "@colyseus/schema";

import {
    World as EcsyWorld,
    _Entity as EcsyEntity,
    Component as EcsyComponent,
    TagComponent as EcsyTagComponent,
    System,
    Types,
} from "ecsy";

import { TYPE_MAP } from "./types";

// Combine Schema + EcsyComponent
export interface Component<C=any> extends Schema, EcsyComponent<C> {};
export class Component<C> extends Schema {
    static schema: any = {};
    static isComponent: true = true;
}

export interface TagComponent<C=any> extends Schema, EcsyTagComponent {};
export class TagComponent extends Component {
    static isTagComponent = true;
}

//
// Copy Ecsy's Component methods into Schema prototype
// (Schema already implements .clone())
//
(Component.prototype as any).copy = EcsyComponent.prototype.copy;
(Component.prototype as any).reset = EcsyComponent.prototype.reset;
(Component.prototype as any).dispose = EcsyComponent.prototype.dispose;

// @ts-ignore
class Entity extends Schema implements EcsyEntity {
    id: number;
    alive: boolean;

    @type({ map: Component }) components = new Map<string, Component>();

    constructor (entityManager?: any) {
        super();

        // @ts-ignore
        this._entityManager = entityManager || null;

        // Unique ID for this entity
        this.id = entityManager._nextEntityId++;
    
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
(Entity.prototype as any).getComponent = EcsyEntity.prototype.getComponent;
(Entity.prototype as any).getRemovedComponent = EcsyEntity.prototype.getRemovedComponent;
(Entity.prototype as any).getComponents = EcsyEntity.prototype.getComponents;
(Entity.prototype as any).getComponentsToRemove = EcsyEntity.prototype.getComponentsToRemove;
(Entity.prototype as any).getComponentTypes = EcsyEntity.prototype.getComponentTypes;
(Entity.prototype as any).getMutableComponent = EcsyEntity.prototype.getMutableComponent;
(Entity.prototype as any).addComponent = EcsyEntity.prototype.addComponent;
(Entity.prototype as any).removeComponent = EcsyEntity.prototype.removeComponent;
(Entity.prototype as any).hasComponent = EcsyEntity.prototype.hasComponent;
(Entity.prototype as any).hasRemovedComponent = EcsyEntity.prototype.hasRemovedComponent;
(Entity.prototype as any).hasAllComponents = EcsyEntity.prototype.hasAllComponents;
(Entity.prototype as any).hasAnyComponents = EcsyEntity.prototype.hasAnyComponents;
(Entity.prototype as any).removeAllComponents = EcsyEntity.prototype.removeAllComponents;
(Entity.prototype as any).copy = EcsyEntity.prototype.copy;
(Entity.prototype as any).clone = EcsyEntity.prototype.clone;
(Entity.prototype as any).reset = EcsyEntity.prototype.reset;
(Entity.prototype as any).remove = EcsyEntity.prototype.remove;

class State extends Schema {
    @type([Entity]) entities: Entity[] = [];
}

export class World extends EcsyWorld {
    state: State;

    constructor(options: any = {}) {
        options.entityClass = Entity;
        super(options);

        this.state = new State();
        this['entityManager']._entities = this.state.entities;
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
                    type = Types.Ref;
                    break;

                case "object":
                    type = (Array.isArray(schemaType))
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