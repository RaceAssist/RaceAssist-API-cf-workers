import {basicAuth} from "hono/basic-auth";
import {Hono} from "hono";
import {cache} from "hono/cache"

const horseRouter = new Hono<{ Bindings: Env }>({strict: false});

const jsonHeader = {
    "Content-Type": "Application/Json",
};
const notFoundResponse = () => new Response("Object Not Found", {status: 404})

horseRouter.get('*', cache({cacheName: 'my-app', cacheControl: 'max-age=120'}));

horseRouter.post("*", async (context, next) => {
    const auth = basicAuth({
        username: context.env.USERNAME,
        password: context.env.PASSWORD,
    });
    await auth(context, next);
});

horseRouter.get("/record/:key", async (context) => {
    let key = context.req.param("key").replace(".json", "");
    const db = context.env.DB;
    const stmt = db.prepare(
        "SELECT * FROM HORSE WHERE HORSE = ?1"
    );
    const result = await stmt.bind(key).first();

    console.log("record is called. key is " + key + " by " + context.req.headers.get("User-Agent"))
    if (!result) {
        console.log("Not Found. That key is " + key)
        return notFoundResponse();
    } else {
        console.log("Found. That key is " + key)
        return new Response(JSON.stringify(result), {
            headers: jsonHeader,
        });
    }
});

horseRouter.get("/list", async (context) => {
    const db = context.env.DB;
    const stmt = db.prepare(
        "SELECT * FROM HORSE"
    );

    const result = await stmt.all();
    const nameList = Array<string>();
    result.results.forEach((object) => {
        nameList.push((object.horseId as string));
    });

    return new Response(JSON.stringify(nameList), {
        headers: jsonHeader,
    });
});

horseRouter.get("/listTest", async (context) => {
    const db = context.env.DB;
    const stmt = db.prepare(
        "SELECT * FROM HORSE"
    );
    const list = await stmt.all<HorseData>();

    const dataList = list.results.map((result) => {
        return result;
    });

    return new Response(JSON.stringify(dataList), {
        headers: jsonHeader,
    });
});

//JSONの追加
horseRouter.post("/push/:key", async (context) => {
    const key = context.req.param("key");

    let horseData = await context.req.json<HorseData>();
    let lastRecordDate = horseData.lastRecordDate.toString();
    let birthDate = horseData.birthDate ? horseData.birthDate.toString() : null;
    let deathDate = horseData.deathDate ? horseData.deathDate.toString() : null;

    let db = context.env.DB;
    let stmt = db.prepare(
        "SELECT * FROM HORSE WHERE HORSE = ?"
    );

    let result = await stmt.bind(key).all();
    if (result.results.length > 0) {
        await context.env.DB.prepare(
            "UPDATE HORSE SET HORSE = ?1, BREEDER = ?2, OWNER = ?3, MOTHER = ?4, FATHER = ?5, COLOR = ?6, STYLE = ?7, SPEED = ?8, JUMP = ?9, HEALTH = ?10, NAME = ?11, BIRTH_DATE = ?12, LAST_RECORD_DATE = ?13, DEATH_DATE = ?14, HISTORY = ?15 WHERE horseId = ?16"
        ).bind(horseData.horse, horseData.breeder, horseData.owner, horseData.mother, horseData.father, horseData.color, horseData.style, horseData.speed, horseData.jump, horseData.health, horseData.name, birthDate, lastRecordDate, deathDate, JSON.stringify(horseData.history), key)
            .run();
    } else {
        await context.env.DB.prepare(
            "INSERT INTO HORSE (HORSE , BREEDER , OWNER , MOTHER , FATHER , COLOR , STYLE , SPEED , JUMP , HEALTH , NAME , BIRTH_DATE , LAST_RECORD_DATE , DEATH_DATE, HISTORY) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)"
        ).bind(horseData.horse, horseData.breeder, horseData.owner, horseData.mother, horseData.father, horseData.color, horseData.style, horseData.speed, horseData.jump, horseData.health, horseData.name, birthDate, lastRecordDate, deathDate, JSON.stringify(horseData.history))
            .run();
    }
    console.log("push is called. key is " + key + " by " + context.req.headers.get("User-Agent"))
    context.text("POST completed")
});

horseRouter.get("/listAll", async (context) => {
    const kv = context.env.RACE_ASSIST;
    const json = await kv.get("horse-list")
    if (!json) {
        return notFoundResponse()
    }
    console.log("lits all is called by " + context.req.headers.get("User-Agent"))
    return new Response(json, {
        headers: jsonHeader,
    });
});
// horseRouter.get("/migration", async (context) => {
//     const kv = context.env.RACE_ASSIST;
//     const json = await kv.get("horse-list")
//     if (!json) {
//         return notFoundResponse()
//     }
//
//
//
//     const list: Array<HorseData> = JSON.parse(json);
//
//     let count = 0;
//
//     context.env.DB.prepare(
//         "CREATE TABLE IF NOT EXISTS HORSE (HORSE TEXT PRIMARY KEY, BREEDER TEXT, OWNER TEXT, MOTHER TEXT, FATHER TEXT, COLOR TEXT, STYLE TEXT, SPEED REAL, JUMP REAL, HEALTH REAL, NAME TEXT, BIRTH_DATE TEXT, LAST_RECORD_DATE TEXT, DEATH_DATE TEXT, HISTORY JSON)"
//     )
//
//
//     const stmt = context.env.DB.prepare(
//         "INSERT INTO HORSE (HORSE , BREEDER , OWNER , MOTHER , FATHER , COLOR , STYLE , SPEED , JUMP , HEALTH , NAME , BIRTH_DATE , LAST_RECORD_DATE , DEATH_DATE , HISTORY) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)"
//     )
//
//     for (const object of list) {
//         count++;
//         let horseData = object;
//         let lastRecordDate = horseData.lastRecordDate.toString();
//         let birthDate = horseData.birthDate ? horseData.birthDate.toString() : null;
//         let deathDate = horseData.deathDate ? horseData.deathDate.toString() : null;
//
//         await stmt.bind(horseData.horse, horseData.breeder, horseData.owner, horseData.mother, horseData.father, horseData.color, horseData.style,
//             horseData.speed, horseData.jump, horseData.health, horseData.name, birthDate, lastRecordDate, deathDate, JSON.stringify(horseData.history))
//             .run();
//     }
//
//     console.log("migration is called by " + context.req.headers.get("User-Agent"))
//     console.log("migration complete " + count + " records")
//     context.text("migration complete " + count + " records")
// });


export default horseRouter;
