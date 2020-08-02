import { Schema } from "@colyseus/schema";
import { createType, copyCopyable, cloneClonable } from "ecsy";

export function applyMixins(derivedCtor: any, baseCtors: any[]) {
    const existingPropertyNames = Object.getOwnPropertyNames(derivedCtor.prototype)
        .concat(Object.getOwnPropertyNames(Object.getPrototypeOf(derivedCtor.prototype)))

    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            //
            // Only apply mixin for methods that don't exist on `derivedCtor`
            //
            if (existingPropertyNames.indexOf(name) === -1) {
                Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
            }
        });
    });
}

export function getEcsyTypeFromSchema(schema: any /* typeof Schema */) {
    const context = schema._context;

    if (!context.ecsyTypes) { context.ecsyTypes = {}; }
    const ecsyTypes = context.ecsyTypes;

    if (!ecsyTypes[schema.name]) {
        ecsyTypes[schema.name] = createType({
            name: schema.name,
            default: new schema(),
            copy: copyCopyable,
            clone: cloneClonable,
        });
    }

    return ecsyTypes[schema.name];
}