import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import type { SharedProps } from '../../types/shared';

interface ResultRow {
    id: number;
    total_correct: number;
    total_wrong: number;
    total_empty: number;
    final_score: number;
    passing_status: string | null;
    participant: { exam_number: string; full_name: string; class_name: string | null } | null;
    exam: { title: string; subject_name: string } | null;
}

export default function ResultPrint({ results, examTitle }: { results: ResultRow[]; examTitle: string | null }) {
    const { props } = usePage<SharedProps>();
    const institution = props.institution;
    const title = examTitle ?? results[0]?.exam?.title ?? 'Rekap Nilai Ujian';
    const subject = results[0]?.exam?.subject_name;

    return (
        <div className="min-h-screen bg-white text-slate-900 print:bg-white">
            <div className="mx-auto max-w-5xl px-6 py-8 print:px-0 print:py-0">
                <div className="mb-4 flex items-center justify-between print:hidden">
                    <Link
                        href="/admin/results"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                        <ArrowLeft size={16} /> Kembali
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="btn-primary h-10 px-3"
                    >
                        <Printer size={16} /> Cetak
                    </button>
                </div>

                <header className="border-b-2 border-slate-900 pb-4 text-center">
                    {institution?.logo_url && (
                        <img
                            src={institution.logo_url}
                            alt="Logo"
                            className="mx-auto mb-2 h-16 w-16 object-contain"
                        />
                    )}
                    <h1 className="text-lg font-bold uppercase">{institution?.school_name ?? 'CBT Online'}</h1>
                    <p className="text-sm">{institution?.exam_event_name ?? 'Rekap Hasil Ujian'}</p>
                    <p className="text-sm">
                        {institution?.academic_year ? `Tahun Pelajaran ${institution.academic_year}` : ''}
                    </p>
                </header>

                <div className="mt-5 text-center">
                    <h2 className="text-base font-bold uppercase">Rekap Nilai</h2>
                    <p className="text-sm">
                        {title}
                        {subject ? ` — ${subject}` : ''}
                    </p>
                </div>

                <table className="mt-5 w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-slate-100 print:bg-slate-100">
                            <th className="border border-slate-400 px-2 py-1.5 text-left">No</th>
                            <th className="border border-slate-400 px-2 py-1.5 text-left">No Peserta</th>
                            <th className="border border-slate-400 px-2 py-1.5 text-left">Nama</th>
                            <th className="border border-slate-400 px-2 py-1.5 text-left">Kelas</th>
                            <th className="border border-slate-400 px-2 py-1.5 text-right">Benar</th>
                            <th className="border border-slate-400 px-2 py-1.5 text-right">Salah</th>
                            <th className="border border-slate-400 px-2 py-1.5 text-right">Kosong</th>
                            <th className="border border-slate-400 px-2 py-1.5 text-right">Nilai</th>
                            <th className="border border-slate-400 px-2 py-1.5 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="border border-slate-400 px-2 py-6 text-center text-slate-500">
                                    Belum ada data hasil ujian.
                                </td>
                            </tr>
                        ) : (
                            results.map((result, index) => (
                                <tr key={result.id}>
                                    <td className="border border-slate-400 px-2 py-1.5">{index + 1}</td>
                                    <td className="border border-slate-400 px-2 py-1.5">
                                        {result.participant?.exam_number}
                                    </td>
                                    <td className="border border-slate-400 px-2 py-1.5">
                                        {result.participant?.full_name}
                                    </td>
                                    <td className="border border-slate-400 px-2 py-1.5">
                                        {result.participant?.class_name ?? '-'}
                                    </td>
                                    <td className="border border-slate-400 px-2 py-1.5 text-right">
                                        {result.total_correct}
                                    </td>
                                    <td className="border border-slate-400 px-2 py-1.5 text-right">
                                        {result.total_wrong}
                                    </td>
                                    <td className="border border-slate-400 px-2 py-1.5 text-right">
                                        {result.total_empty}
                                    </td>
                                    <td className="border border-slate-400 px-2 py-1.5 text-right font-semibold">
                                        {Number(result.final_score).toFixed(2)}
                                    </td>
                                    <td className="border border-slate-400 px-2 py-1.5 text-center">
                                        {result.passing_status === 'lulus' ? 'Lulus' : 'Belum Lulus'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="mt-8 flex justify-between text-sm print:mt-10">
                    <div>
                        <p>Jumlah peserta: {results.length}</p>
                        <p>
                            Rata-rata:{' '}
                            {results.length
                                ? (
                                      results.reduce((total, result) => total + Number(result.final_score), 0) /
                                      results.length
                                  ).toFixed(2)
                                : '0.00'}
                        </p>
                    </div>
                    <div className="text-center">
                        <p>Dicetak pada {new Date().toLocaleDateString('id-ID')}</p>
                        <p className="mt-12 border-t border-slate-400 pt-1">Panitia Ujian</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
