/* 
 * used to show various types of notifications
*/

import toast from "react-hot-toast";

import { ENABLE_NOTIFICATIONS } from "../config";

// show promise based notification
export const notifyPromise = (promise: Promise<any>, success = "Success!", loading = "Loading...") => {
    if (!ENABLE_NOTIFICATIONS) return;
    
    toast.promise(promise, {
        loading,
        success,
        error: (err) => `Error - ${err.message || "Something went wrong"}`
    });
}

// show success notification
export const notifySuccess = (text: string) => {
    if (!ENABLE_NOTIFICATIONS) return;
    
    toast.success(text);
}

// show error notification
export const notifyError = (text: string) => {
    if (!ENABLE_NOTIFICATIONS) return;
    
    toast.error(text);
}