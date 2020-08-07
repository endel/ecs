# ATTENTION: THIS IS JUST AN EXPERIMENT

**NOT READY TO USE**

The current state of this repository is very messy - basically a bunch of glue code trying to make `@colyseus/schema` work along with [ECSY](https://github.com/MozillaReality/ecsy).

If you're feeling brave enough, you're encouraged to continue performing some experiments with this repository and help it reach a _not that bad_ state.

<a href="https://travis-ci.org/endel/ecs">
    <img src="https://img.shields.io/travis/endel/ecs.svg?style=for-the-badge" alt="Build status" />
</a>

## Goal

There are quite a few Entity Component Systems written in JavaScript available out there. I'm currently experimenting integrating `@colyseus/schema` with [ECSY](https://github.com/MozillaReality/ecsy).

The goal of this project is to have a good way to use ECS along with [Colyseus](https://github.com/colyseus/colyseus) - being able to synchronize entities and components defined in the Entity Component System.

## Progress so far

- This module defines a `Component` that extends from `Schema`.
- ECSY _and_ `@colyseus/schema` require the end user to to define the "schema" of the data structure
    - I'm overriding the ECSY's `registerComponent()` to replicate the definitions from `@colyseus/schema` (through the `@type()` annotation) into ECSY's schema.
- ~ECSY has a component called `TagComponent` that does not have any data on it. This conflicts with `@colyseus/schema`, as every `Schema` instance is required to hold at least one property.~ - @colyseus/schema@^1.0.0-alpha.29 now allows to have intermediary "abstract" structures with no fields.
- The [test scenario](test/EcsTest.ts) is able to encode the `World` into ~1236 bytes.
    - The test scenario has 50 entities with 3 components on each of them - two vectors and a component holding a string.
