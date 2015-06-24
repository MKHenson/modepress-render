export interface IConfig
{
    /**
    * The port number to listen on
    * eg: 3000
    */
    port: number;

    /**
    * The host adress our database is on
    * eg: "localhost"
    */
    databaseHost: string;

    /**
    * The port number of the database
    * eg: 12780
    */
    databasePort: number;
    
    /**
    * The name of the database to connect to
    * eg: "test"
    */
    databaseName: string;

    /**
    * The name of the database collection to connect to
    * eg: "renders"
    */
    databaseCollection: string;

    /**
    * The time each page render will be stored before its updated again
    * eg: 2592000000 (30 days)
    */
    cachePeriod: number;
}