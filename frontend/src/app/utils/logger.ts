/* 
 * used to log messages
*/

import { ENABLE_LOGGING } from "../config";

// log normal message
export function log(message: string, object?: any) {
    if (ENABLE_LOGGING) {
        console.log(`%c[HdM-Place]%c ${message}`, "color: #4ac900; font-weight: bold;", "color: inherit;", object ?? "");
    }
}

// log warning
export function warn(message: string, object?: any) {
    if (ENABLE_LOGGING) {
        console.warn(`%c[HdM-Place]%c ${message}`, "color: rgb(255, 196, 0); font-weight: bold;", "color: inherit;", object ?? "");
    }
}

// log error
export function error(message: string, object?: any) {
    if (ENABLE_LOGGING) {
        console.error(`%c[HdM-Place]%c ${message}`, "color: #ff0000ff; font-weight: bold;", "color: inherit;", object ?? "");
    }
}

export default { log, warn, error };
