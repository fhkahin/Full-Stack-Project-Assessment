import request from "supertest";
import app from "./app.js";
import db from "./db.js";

describe("/api", () => {
    describe("/videos", () => {
        describe("GET", () => {
            it("Returns the list of videos", async () => {
                const response = await request(app).get("/api/videos");

                expect(response.statusCode).toBe(200);
                expect(response.body[0].title).toBe("Never Gonna Give You Up");
                expect(response.body[0].url).toBe(
                    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                );
            });
        });

        describe("POST", () => {
            it("Adds a new video and returns its id", async () => {
                const newVideo = {
                    title: "Sample Video",
                    src: "https://www.youtube.com/watch?v=sample"
                };

                const response = await request(app)
                    .post("/api/videos")
                    .send(newVideo);

                expect(response.statusCode).toBe(201);
                expect(response.body).toHaveProperty("id");

                // Verify the video was added to the database
                const dbResponse = await db.query("SELECT * FROM videos WHERE id = $1", [response.body.id]);
                expect(dbResponse.rows.length).toBe(1);
                expect(dbResponse.rows[0].title).toBe(newVideo.title);
                expect(dbResponse.rows[0].src).toBe(newVideo.src);
            });

            it("Returns a 400 error if title or src is missing", async () => {
                const incompleteVideo = {
                    title: "Incomplete Video"
                };

                const response = await request(app)
                    .post("/api/videos")
                    .send(incompleteVideo);

                expect(response.statusCode).toBe(400);
                expect(response.body).toHaveProperty("error", "Title and SRC are required");
            });
        });

        describe("/:id", () => {
            describe("DELETE", () => {
                it("Returns a successful response if the id exists", async () => {
                    const response = await request(app).delete("/api/videos/1");

                    expect(response.statusCode).toBe(204);
                });

                it("Deletes the video from the database if the id exists", async () => {
                    await request(app).delete("/api/videos/1");

                    const dbResponse = await db.query(
                        "SELECT * FROM videos WHERE id = $1",
                        [1]
                    );
                    expect(dbResponse.rows.length).toBe(0);
                });

                it("Returns a 404 error if the video does not exist", async () => {
                    const response = await request(app).delete("/api/videos/nonexistent-id");

                    expect(response.statusCode).toBe(404);
                    expect(response.body).toHaveProperty("error", "Video not found");
                });
            });
        });
    });
});

