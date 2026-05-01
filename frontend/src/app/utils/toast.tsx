/* 
 * used to show various types of notifications
*/

import toast from "react-hot-toast";

const ENABLE_LOGGING = true;

export const notifyPromise = (promise: Promise<any>, success = "Success!", loading = "Loading...") => {
    if (!ENABLE_LOGGING) return;
    
    toast.promise(promise, {
        loading,
        success,
        error: (err) => `Error - ${err.message || "Something went wrong"}`
    })
}

export const notifySuccess = (text: string) => {
    if (!ENABLE_LOGGING) return;
    
    toast.success(text);
}

export const notifyError = (text: string) => {
    if (!ENABLE_LOGGING) return;
    
    toast.error(text);
}