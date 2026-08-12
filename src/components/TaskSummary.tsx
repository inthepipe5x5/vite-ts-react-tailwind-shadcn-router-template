/* eslint-disable no-extra-boolean-cast */
/** biome-ignore-all lint/complexity/noExtraBooleanCast: <explanation> */
/** biome-ignore-all lint/correctness/noUnusedVariables: <explanation> */
/** biome-ignore-all lint/complexity/noUselessLoneBlockStatements: <explanation> */
import { AlertCircle, CheckCircle, Sparkles } from "lucide-react";
import qc from "@/data/queryClient";

type TaskSummaryProps = {
    taskQueryKey: string[]; //used to retrieve the prefetched tasks
    sectionTitle: string;
    sectionDescription: string;
}

export default function TaskSummary(props: TaskSummaryProps) {
    const { data: tasks } = qc.getQueryData<{ location: string; todo: string; solution: string; benefit: string; }[]>(props.taskQueryKey) || { data: [] };
    return (
        <div className="space-y-4" >
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between" >
                <div className="flex items-center space-x-3" >
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                        <h3 className="text-sm font-semibold text-emerald-300" > {!!props.sectionTitle ? props.sectionTitle : ''} </h3>
                        <p className="text-xs text-emerald-400/80" >
                            {!!props.sectionDescription ? props.sectionDescription : ''}
                        </p>
                    </div>
                </div>
            </div>

            < div className="grid grid-cols-1 md:grid-cols-2 gap-4" >
                {
                    tasks.map((item, idx) => (
                        <div key={idx /**TODO: CHANGE THIS LATER TO THE TASK KEY */} className="bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition" >
                            <div className="flex items-center justify-between mb-2" >
                                <span className="text-xs font-mono bg-slate-800 text-indigo-400 px-2.5 py-1 rounded-md border border-slate-700" >
                                    {item.location}
                                </span>
                                < span className="text-xs text-slate-500 font-mono" > TODO #{idx + 1} </span>
                            </div>
                            < h4 className="text-sm font-semibold text-rose-300 mb-2 flex items-start gap-1.5" >
                                <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                                <span>"{item.todo}" </span>
                            </h4>
                            < div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3 my-2 font-mono text-xs text-emerald-300" >
                                {item.solution}
                            </div>
                            < p className="text-xs text-slate-400 flex items-center gap-1 mt-2" >
                                <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                {item.benefit}
                            </p>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}