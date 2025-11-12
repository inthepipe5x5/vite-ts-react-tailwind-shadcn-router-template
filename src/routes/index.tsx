import { useRoutes } from "react-router-dom";
import AppRoutes from "./AppRoutes";

export const AppRouter = () => {
    const element = useRoutes(AppRoutes);
    return element;
}