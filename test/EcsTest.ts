import util from "util";
import assert from "assert";
import { type, Reflection, Schema, Context } from "@colyseus/schema";
import { World, System, TagComponent, State } from "../src";
import { Component } from "../src";
// import { Component } from "ecsy";

describe("ECS", () => {
    describe("MovableSystem", () => {
        const NUM_ELEMENTS = 50;
        const SPEED_MULTIPLIER = 0.3;
        const SHAPE_SIZE = 50;
        const SHAPE_HALF_SIZE = SHAPE_SIZE / 2;

        // Initialize canvas
        let window = { innerWidth: 800, innerHeight: 600 };
        let canvas = { width: 800, height: 600 };
        let canvasWidth = canvas.width = window.innerWidth;
        let canvasHeight = canvas.height = window.innerHeight;

        // Velocity component
        class Velocity extends Component<any> {
            @type("number") x: number;
            @type("number") y: number;
        }

        // Position component
        class Position extends Component<any> {
            @type("number") x: number;
            @type("number") y: number;
        }

        class Shape extends Component<any> {
            @type("string") primitive: string = "box";
        }

        // Renderable component
        class Renderable extends TagComponent { }

        // MovableSystem
        class MovableSystem extends System {
            static queries = {
                moving: {
                    components: [Velocity, Position]
                }
            };

            // This method will get called on every frame by default
            execute(delta, time) {
                // Iterate through all the entities on the query
                this.queries.moving.results.forEach(entity => {
                    var velocity = entity.getComponent(Velocity);
                    var position = entity.getMutableComponent(Position);
                    position.x += velocity.x * delta;
                    position.y += velocity.y * delta;

                    if (position.x > canvasWidth + SHAPE_HALF_SIZE) position.x = - SHAPE_HALF_SIZE;
                    if (position.x < - SHAPE_HALF_SIZE) position.x = canvasWidth + SHAPE_HALF_SIZE;
                    if (position.y > canvasHeight + SHAPE_HALF_SIZE) position.y = - SHAPE_HALF_SIZE;
                    if (position.y < - SHAPE_HALF_SIZE) position.y = canvasHeight + SHAPE_HALF_SIZE;
                });
            }
        }

        it("should work", (done) => {
            // Create world and register the components and systems on it
            var world = new World();

            // Create Schema state, and assign entities array to it.
            const state = new State();
            world.useEntities(state.entities);

            world
                .registerComponent(Velocity)
                .registerComponent(Position)
                .registerComponent(Shape)
                .registerComponent(Renderable)
                .registerSystem(MovableSystem);

            // Some helper functions when creating the components
            function getRandomVelocity() {
                return {
                    x: SPEED_MULTIPLIER * (2 * Math.random() - 1),
                    y: SPEED_MULTIPLIER * (2 * Math.random() - 1)
                };
            }

            function getRandomPosition() {
                return {
                    x: Math.random() * canvasWidth,
                    y: Math.random() * canvasHeight
                };
            }

            function getRandomShape() {
                return {
                    primitive: Math.random() >= 0.5 ? 'circle' : 'box'
                };
            }

            for (let i = 0; i < NUM_ELEMENTS; i++) {
                let entity = world
                    .createEntity()
                    .addComponent(Velocity, getRandomVelocity())
                    .addComponent(Shape, getRandomShape())
                    .addComponent(Position, getRandomPosition())
                // .addComponent(Renderable)

                const velocity = entity.getComponent(Velocity);
                console.log("INITIAL VELOCITY =>", velocity.x, velocity.y, velocity.toJSON());

                const shape = entity.getComponent(Shape);
                console.log("INITIAL SHAPE =>", shape.primitive, shape.toJSON());

                const position = entity.getComponent(Position);
                console.log("INITIAL POSITION =>", position.x, position.y, position.toJSON());
            }

            const decodedState = Reflection.decode(Reflection.encode(state));
            const fullEncode = state.encode();
            console.log("ENCODED SIZE =>", fullEncode.length);
            decodedState.decode(fullEncode);

            // // Finish.
            // done();

            // Run!
            function run() {
                // Compute delta and elapsed time
                var time = Date.now();
                var delta = time - lastTime;

                // Run all the systems
                world.execute(delta, time);

                const encoded = state.encode();
                console.log("ENCODED SIZE =>", encoded.length);
                decodedState.decode(encoded);

                lastTime = time;
            }
            var lastTime = Date.now();

            let simulationInterval = setInterval(run, 1000 / 60);
            setTimeout(() => {
                clearInterval(simulationInterval);
                done();
            }, 1000);
        });

    });

    describe("ECSY <-> @colyseus/schema internals", () => {
        it("Component._typeId should match Schema's _typeid", () => {
            const type = Context.create();

            class MyComponent extends Component {
                @type("string") str: string;
            }

            assert.equal(MyComponent._typeId, MyComponent._typeid);
        });
    })

    describe("Custom Types", () => {
        it("should allow custom defined Schema types", () => {
            class Vector2 extends Schema {
                @type("number") x: number;
                @type("number") y: number;

                set(x: number, y: number) {
                    this.x = x;
                    this.y = y;
                }
            }

            class Movement extends Component {
                @type(Vector2) velocity: Vector2 = new Vector2();
            }

            // Create world and register the components and systems on it
            var world = new World();

            // Create Schema state, and assign entities array to it.
            const state = new State();
            world.useEntities(state.entities);

            world.registerComponent(Movement);

            const entity = world
                .createEntity()
                .addComponent(Movement)

            const movement = entity.getMutableComponent(Movement);
            movement.velocity.set(10, 20);

            const decodedState = Reflection.decode(Reflection.encode(state));
            decodedState.decode(state.encode());
        });
    })

});