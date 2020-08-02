import { System, World } from "@colyseus/ecs";

import { Client } from "colyseus.js";
import { State, Circle, Intersecting, CanvasContext, Movement, DemoSettings } from "./shared/components/components";
import { getRendererSystem } from "./systems";

const client = new Client("ws://localhost:2567");

let world = new World();

async function connect() {
    const room = await client.joinOrCreate("my_room", {}, State);
    world.useEntities(room.state.entities);
}

document.addEventListener("DOMContentLoaded", async () => {
    const ctx = document.querySelector("canvas").getContext("2d");

    world
        .registerComponent(Circle)
        .registerComponent(Movement)
        .registerComponent(Intersecting)
        .registerComponent(CanvasContext)
        .registerComponent(DemoSettings)
        .registerSystem(getRendererSystem(ctx));

    // connect to colyseus' room
    await connect();

    let previousTime = Date.now();
    function render() {
        const now = Date.now();
        world.execute(now - previousTime);

        previousTime = now;
        requestAnimationFrame(render);
    }
    render();
});
