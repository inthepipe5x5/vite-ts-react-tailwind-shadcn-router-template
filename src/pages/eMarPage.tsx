import { PetEMARGrid } from "@/components/petEMARGrid";

export default function EMARPage() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">eMAR Schedule</h1>
            <PetEMARGrid />
        </div>
    );
}