import winston from "winston";

const {combine, timestamp, json} = winston.format;
const dt = new Date();
const dtString = `${dt.getFullYear()}${dt.getMonth()+1}${dt.getDate()}${dt.getHours()}${dt.getMinutes()}${dt.getSeconds()}${dt.getMilliseconds()}`;

const logFormat = winston.format.printf(info => {
    const formattedDate = info.timestamp.replace('T', ' ').replace('Z', '');
    return `${formattedDate}|${info.level}|${
     info.message
    };`;
   });

export const logger = winston.createLogger({
    level: 'info',
    format: combine(timestamp(), logFormat),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston.transports.File({ filename: `./logs/error.log.${dtString}`, level: 'error' }),
        new winston.transports.File({ filename: `./logs/combined.log.${dtString}` })
    ]
});
