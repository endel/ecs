import util from "util";
import assert, { doesNotMatch } from "assert";

import { type, Reflection, Schema, ArraySchema } from "@colyseus/schema";
import { World, System, TagComponent, State, Component, Entity } from "../src";

function random(a: number, b: number) {
    return Math.random() * (b - a) + a;
}

function intersection(circleA: any, circleB: any) {
    var a, dx, dy, d, h, rx, ry;
    var x2, y2;

    // dx and dy are the vertical and horizontal distances between the circle centers.
    dx = circleB.position.x - circleA.position.x;
    dy = circleB.position.y - circleA.position.y;

    // Distance between the centers
    d = Math.sqrt(dy * dy + dx * dx);

    // Check for solvability
    if (d > circleA.radius + circleB.radius) {
        // No solution: circles don't intersect
        return false;
    }
    if (d < Math.abs(circleA.radius - circleB.radius)) {
        // No solution: one circle is contained in the other
        return false;
    }

    /* 'point 2' is the point where the line through the circle
     * intersection points crosses the line between the circle
     * centers.
     */

    /* Determine the distance from point 0 to point 2. */
    a =
        (circleA.radius * circleA.radius -
            circleB.radius * circleB.radius +
            d * d) /
        (2.0 * d);

    /* Determine the coordinates of point 2. */
    x2 = circleA.position.x + (dx * a) / d;
    y2 = circleA.position.y + (dy * a) / d;

    /* Determine the distance from point 2 to either of the
     * intersection points.
     */
    h = Math.sqrt(circleA.radius * circleA.radius - a * a);

    /* Now determine the offsets of the intersection points from
     * point 2.
     */
    rx = -dy * (h / d);
    ry = dx * (h / d);

    /* Determine the absolute intersection points. */
    var xi = x2 + rx;
    var xi_prime = x2 - rx;
    var yi = y2 + ry;
    var yi_prime = y2 - ry;

    return [xi, yi, xi_prime, yi_prime];
}

describe("Example", () => {
    describe("IntersectionSystem", () => {
        class Vector2 extends Schema {
            @type("number") x: number = 0;
            @type("number") y: number = 0;

            set(x: number, y: number) {
                this.x = x;
                this.y = y;
                return this;
            }
        }

        class Movement extends Component {
            @type(Vector2) velocity = new Vector2();
            @type(Vector2) acceleration = new Vector2();
        }

        class Circle extends Component {
            @type(Vector2) position = new Vector2();
            @type("number") radius: number;
            @type(Vector2) velocity = new Vector2();
            @type(Vector2) acceleration = new Vector2();
        }

        class CanvasContext extends Component {
            @type("number") width: number;
            @type("number") height: number;
        }

        class DemoSettings extends Component {
            @type("number") speedMultiplier = 0.001;
        }

        class Intersecting extends Component {
            @type(["number"]) points: number[] = [];
        }

        class State extends Schema {
            // @ts-ignore
            @type([Entity]) entities = new ArraySchema<Entity>();
        }

        class MovementSystem extends System {
            static queries = {
                entities: { components: [Circle, Movement] },
                context: { components: [CanvasContext, DemoSettings], mandatory: true }
            };

            execute(delta: number) {
                var context = this.queries.context.results[0];
                let canvasWidth = context.getComponent(CanvasContext).width;
                let canvasHeight = context.getComponent(CanvasContext).height;
                let multiplier = context.getComponent(DemoSettings).speedMultiplier;

                let entities = this.queries.entities.results;
                for (var i = 0; i < entities.length; i++) {
                    let entity = entities[i];
                    let circle = entity.getMutableComponent(Circle);
                    let movement = entity.getMutableComponent(Movement);

                    circle.position.x +=
                        movement.velocity.x * movement.acceleration.x * delta * multiplier;
                    circle.position.y +=
                        movement.velocity.y * movement.acceleration.y * delta * multiplier;

                    if (movement.acceleration.x > 1)
                        movement.acceleration.x -= delta * multiplier;
                    if (movement.acceleration.y > 1)
                        movement.acceleration.y -= delta * multiplier;
                    if (movement.acceleration.x < 1) movement.acceleration.x = 1;
                    if (movement.acceleration.y < 1) movement.acceleration.y = 1;

                    if (circle.position.y + circle.radius < 0)
                        circle.position.y = canvasHeight + circle.radius;

                    if (circle.position.y - circle.radius > canvasHeight)
                        circle.position.y = -circle.radius;

                    if (circle.position.x - circle.radius > canvasWidth)
                        circle.position.x = 0;

                    if (circle.position.x + circle.radius < 0)
                        circle.position.x = canvasWidth;
                }
            }
        }

        class IntersectionSystem extends System {
            static queries = {
                entities: { components: [Circle] }
            }

            execute() {
                let entities = this.queries.entities.results;

                for (var i = 0; i < entities.length; i++) {
                    let entity = entities[i];

                    if (entity.hasComponent(Intersecting)) {
                        entity.getMutableComponent(Intersecting).points = [];
                    }

                    let circle = entity.getComponent(Circle);

                    for (var j = i + 1; j < entities.length; j++) {
                        let entityB = entities[j];
                        let circleB = entityB.getComponent(Circle);

                        var intersect = intersection(circle, circleB);
                        if (intersect !== false) {
                            var intersectComponent;
                            if (!entity.hasComponent(Intersecting)) {
                                entity.addComponent(Intersecting);
                            }

                            intersectComponent = entity.getMutableComponent(Intersecting);
                            intersectComponent.points.push(...intersect);
                        }
                    }

                    if (
                        entity.hasComponent(Intersecting) &&
                        entity.getComponent(Intersecting).points.length === 0
                    ) {
                        entity.removeComponent(Intersecting);
                    }
                }
            }

            stop() {
                super.stop();
                // Clean up interesection when stopping
                // let entities = this.queries.entities;
                let entities = this.queries.entities.results;

                for (var i = 0; i < entities.length; i++) {
                    let entity = entities[i];
                    if (entity.hasComponent(Intersecting)) {
                        entity.getMutableComponent(Intersecting).points = [];
                    }
                }
            }
        }

        it("execute world simulation", function (done) {
            const state = new State();

            const world = new World();
            world.useEntities(state.entities);

            world
                .registerComponent(Circle)
                .registerComponent(Movement)
                .registerComponent(Intersecting)
                .registerComponent(CanvasContext)
                .registerComponent(DemoSettings)
                .registerSystem(MovementSystem)
                .registerSystem(IntersectionSystem);

            // Used for singleton components
            var singletonEntity = world.createEntity()
                .addComponent(CanvasContext)
                .addComponent(DemoSettings);

            const width = 800;
            const height = 600;

            const canvasComponent = singletonEntity.getMutableComponent(CanvasContext);
            canvasComponent.width = width;
            canvasComponent.height = height;

            for (var i = 0; i < 30; i++) {
                var entity = world
                    .createEntity()
                    .addComponent(Circle)
                    .addComponent(Movement);

                const circle = entity.getMutableComponent(Circle);
                circle.position.set(random(0, width), random(0, height));
                circle.radius = random(20, 100);

                const movement = entity.getMutableComponent(Movement);
                movement.velocity.set(random(-20, 20), random(-20, 20));
            }

            const deltaTime = 1000 / 60;

            let simulations = 0;

            const decodedState = new State();
            decodedState.decode(state.encodeAll());

            const simulationInterval = setInterval(() => {
                world.execute(deltaTime);

                // simulate 10 times.
                simulations++;

                const encoded = state.encode();
                console.log("ENCODED (bytes) =>", encoded.length);
                decodedState.decode(encoded);

                if (simulations > 10) {
                    clearInterval(simulationInterval);
                    done();
                }

            }, 1000 / 60);
        });

    });
});