import { type } from "@colyseus/schema";
import { World, System, TagComponent } from "../src";
import { Component } from "../src";
// import { Component } from "ecsy";

describe("ECS", () => {
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
    class Renderable extends TagComponent {}

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

                console.log("Result:", position.toJSON());

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
                .addComponent(Renderable)

            const velocity = entity.getComponent(Velocity);
            console.log("INITIAL VELOCITY =>", velocity.x, velocity.y, velocity.toJSON());

            const shape = entity.getComponent(Shape);
            console.log("INITIAL SHAPE =>", shape.primitive, shape.toJSON());

            const position = entity.getComponent(Position);
            console.log("INITIAL POSITION =>", position.x, position.y, position.toJSON());
        }

        done();

        // // Run!
        // function run() {
        //     // Compute delta and elapsed time
        //     var time = Date.now();
        //     var delta = time - lastTime;

        //     // Run all the systems
        //     world.execute(delta, time);

        //     lastTime = time;
        // }
        // var lastTime = Date.now();

        // let simulationInterval = setInterval(run, 1000/60);
        // setTimeout(() => {
        //     clearInterval(simulationInterval);
        //     done();
        // }, 1000);
    });

});