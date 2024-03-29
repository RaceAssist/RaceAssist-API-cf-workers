
type  Env = {
    BUCKET_BET: R2Bucket;
    BUCKET_RESULT: R2Bucket;
    RACE_ASSIST : KVNamespace;
    USERNAME: string;
    PASSWORD: string;
    DB: D1Database;
}

interface HorseData {
    horse: String,
    breeder: String | null,
    owner: String | null,
    mother: String | null,
    father: String | null,
    history: History[],
    color: String,
    style: String,
    speed: Number,
    jump: Number,
    health: Number,
    name: String | null,
    birthDate: Date | null,
    lastRecordDate: Date,
    deathDate: Date | null
}

interface History {
    raceId: String,
    rank: number,
}