/* eslint-disable no-extra-boolean-cast */
/** Loader functions for react-router routes to pre-fetch data before rendering the route. These functions are used in the route definitions to ensure that the necessary data is available when the component is rendered.
 * 
 */
import supabase from "@/data/supabase";
import type { LoaderFunctionArgs } from "react-router-dom";
import qc from "@/data/queryClient";

export const LoadUser = async ({ params }: LoaderFunctionArgs) => {
    try {
        const userId = params?.userId ?? "";
        if (!!!userId) throw new Error(`User ID is required, received '${userId}'`);
        const queryKey = ['users', userId];
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        //cache the data in react-query for later use
        qc.setQueryData(queryKey, data);
        return data;
    } catch (error) {
        console.error(`LoadUser() - Error loading user data:`, error);
        throw error;
    }
};

export const LoadPet = async ({ params }: LoaderFunctionArgs) => {
    try {
        const petId = params?.petId ?? "";
        if (!!!petId) throw new Error(`Pet ID is required, received '${petId}'`);
        const queryKey = ['pets', petId];
        const { data, error } = await supabase
            .from('pets')
            .select('*')
            .eq('id', petId) //TODO: double check this pk
            .single();
        if (error) throw error;
        //cache the data in react-query for later use
        qc.setQueryData(queryKey, data);
        return data;
    } catch (error) {
        console.error(`LoadPet() - Error loading pet data:`, error);
        throw error;
    }
};
export const LoadTask = async ({ params }: LoaderFunctionArgs) => {
    try {
        const taskId = params?.taskId ?? "";
        if (!!!taskId) throw new Error(`Task ID is required, received '${taskId}'`);
        const queryKey = ['tasks', taskId];
        const { data, error } = await supabase
            .from('pet_tasks')
            .select('*')
            .eq('task_id', taskId)
            .single();
        if (error) throw error;
        //cache the data in react-query for later use
        qc.setQueryData(queryKey, data);
        return data;
    } catch (error) {
        console.error(`LoadTask() - Error loading task data:`, error);
        throw error;
    }
};