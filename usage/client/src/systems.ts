import { System } from "@colyseus/ecs";
import { Circle, Intersecting, CanvasContext } from "./shared/components/components";

function fillCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.fill();

    return this;
}

function drawLine(ctx: CanvasRenderingContext2D, a: number, b: number, c: number, d: number) {
    ctx.beginPath(), ctx.moveTo(a, b), ctx.lineTo(c, d), ctx.stroke();
}

export function getRendererSystem(ctx: CanvasRenderingContext2D) {
    return class Renderer extends System {
        static queries = {
            circles: { components: [Circle] },
            intersectingCircles: { components: [Intersecting] },
            context: { components: [CanvasContext], mandatory: true }
        };

        execute() {
            var context = this.queries.context.results[0];
            let canvasComponent = context.getComponent(CanvasContext);
            let canvasWidth = canvasComponent.width;
            let canvasHeight = canvasComponent.height;

            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            let circles = this.queries.circles.results;
            for (var i = 0; i < circles.length; i++) {
                let circle = circles[i].getComponent(Circle);

                ctx.beginPath();
                ctx.arc(
                    circle.position.x,
                    circle.position.y,
                    circle.radius,
                    0,
                    2 * Math.PI,
                    false
                );
                ctx.lineWidth = 1;
                ctx.strokeStyle = "#fff";
                ctx.stroke();
            }

            let intersectingCircles = this.queries.intersectingCircles.results;
            for (let i = 0; i < intersectingCircles.length; i++) {
                let intersect = intersectingCircles[i].getComponent(Intersecting);
                if (!intersect)  {
                    console.log("intersect component not found.");
                    continue;
                }

                // TODO: use sequences of 4 items inside 'points'
                for (var j = 0; j < intersect.points.length; j++) {
                    var points = intersect.points[j];
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#ff9";

                    ctx.fillStyle = "rgba(255, 255,255, 0.2)";
                    fillCircle(ctx, points[0], points[1], 8);
                    fillCircle(ctx, points[2], points[3], 8);

                    ctx.fillStyle = "#fff";
                    fillCircle(ctx, points[0], points[1], 3);
                    fillCircle(ctx, points[2], points[3], 3);

                    drawLine(ctx, points[0], points[1], points[2], points[3]);
                }
            }
        }
    }
}
