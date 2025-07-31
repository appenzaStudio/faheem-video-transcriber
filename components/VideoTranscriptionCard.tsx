import React, { useState, useEffect } from 'react';
import { FileState } from '../App';
import { Icon } from './Icon';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';
import TranscriptionDisplay from './TranscriptionDisplay';

// --- Data for Metadata Form (Egyptian Curriculum) ---
const EGYPTIAN_CURRICULUM = {
    "المرحلة الابتدائية": {
        "الصف الأول الابتدائي": { "اللغة العربية": ["المحور الأول", "المحور الثاني"], "الرياضيات": ["الفصل الأول", "الفصل الثاني"], "اكتشف": ["الفصل الأول", "الفصل الثاني"] },
        "الصف الثاني الابتدائي": { "اللغة العربية": ["المحور الأول", "المحور الثاني"], "الرياضيات": ["الفصل الأول", "الفصل الثاني"], "اكتشف": ["الفصل الأول", "الفصل الثاني"] },
        "الصف الثالث الابتدائي": { "اللغة العربية": ["المحور الأول", "المحور الثاني"], "الرياضيات": ["الفصل الأول", "الفصل الثاني"], "اكتشف": ["الفصل الأول", "الفصل الثاني"] },
        "الصف الرابع الابتدائي": {
            "اللغة العربية": ["المحور الأول: أكتشف ذاتي", "المحور الثاني: علاقاتي مع الآخرين"],
            "العلوم": ["المفهوم الأول: التكيف والبقاء", "المفهوم الثاني: كيف تعمل الحواس", "المفهوم الثالث: الضوء وحاسة البصر"],
            "الدراسات الاجتماعية": ["الوحدة الأولى: بلدنا ورموزه الوطنية", "الوحدة الثانية: المظاهر الطبيعية في بلدنا", "الوحدة الثالثة: الموارد والخدمات في بلدنا"],
            "الرياضيات": ["الوحدة الأولى: القيمة المكانية", "الوحدة الثانية: استراتيجيات عمليتي الجمع والطرح"],
            "تكنولوجيا المعلومات والاتصالات": ["المحور الأول: دور تكنولوجيا المعلومات والاتصالات في حياتنا", "المحور الثاني: احتياطات السلامة الرقمية"]
        },
        "الصف الخامس الابتدائي": {
            "اللغة العربية": ["المحور الأول: أكتشف ذاتي", "المحور الثاني: علاقاتي مع الآخرين"],
            "العلوم": ["المفهوم الأول: احتياجات النبات", "المفهوم الثاني: انتقال الطاقة في النظام البيئي"],
            "الدراسات الاجتماعية": ["الوحدة الأولى: الملامح الطبيعية لبلدي مصر", "الوحدة الثانية: لمحات من تاريخ وحضارة بلدي"],
             "الرياضيات": ["الوحدة الأولى: الكسور العشرية", "الوحدة الثانية: العلاقات بين الأعداد"],
        },
        "الصف السادس الابتدائي": {
            "اللغة العربية": ["المحور الأول", "المحور الثاني"],
            "العلوم": ["المفهوم الأول: الخلية كنظام", "المفهوم الثاني: الجسم كنظام"],
            "الدراسات الاجتماعية": ["الوحدة الأولى: وطننا العربي", "الوحدة الثانية: ملامح من تاريخنا الإسلامي"],
            "الرياضيات": ["الوحدة الأولى: عملية القسمة والعوامل والمضاعفات", "الوحدة الثانية: الأعداد النسبية"],
        }
    },
    "المرحلة الإعدادية": {
        "الصف الأول الإعدادي": {
            "الجبر والإحصاء": ["الوحدة الأولى: الأعداد النسبية", "الوحدة الثانية: الجبر"],
            "الهندسة": ["الوحدة الرابعة: مفاهيم هندسية", "الوحدة الخامسة: التطابق والتحويلات الهندسية"],
            "العلوم": ["الوحدة الأولى: المادة وتركيبها", "الوحدة الثانية: الطاقة", "الوحدة الثالثة: التنوع والتكيف في الكائنات الحية"],
            "الدراسات الاجتماعية": ["الوحدة الأولى: رحلة عبر الفضاء (جغرافيا)", "الوحدة الرابعة: مصر التاريخ (تاريخ)"],
        },
        "الصف الثاني الإعدادي": {
            "الجبر والإحصاء": ["الوحدة الأولى: الأعداد الحقيقية", "الوحدة الثانية: العلاقة بين متغيرين"],
            "الهندسة": ["الوحدة الرابعة: متوسطات المثلث", "الوحدة الخامسة: التباين"],
            "العلوم": ["الوحدة الأولى: دورية العناصر وخواصها", "الوحدة الثانية: الغلاف الجوي وحماية كوكب الأرض"],
            "الدراسات الاجتماعية": ["الوحدة الأولى: وطننا العربي (جغرافيا)", "الوحدة الثالثة: حياة الرسول (ص) (تاريخ)"],
        },
        "الصف الثالث الإعدادي": {
            "الجبر والإحصاء": ["الوحدة الأولى: العلاقات والدوال", "الوحدة الثانية: النسب والتناسب"],
            "حساب المثلثات والهندسة": ["الوحدة الرابعة: حساب المثلثات", "الوحدة الخامسة: الهندسة التحليلية"],
            "العلوم": ["الوحدة الأولى: القوى والحركة", "الوحدة الثانية: الطاقة الضوئية"],
            "الدراسات الاجتماعية": ["الوحدة الأولى: الجغرافيا الطبيعية للعالم", "الوحدة الثالثة: مصر تحت الحكم العثماني"],
        }
    },
    "المرحلة الثانوية": {
        "الصف الأول الثانوي": {
            "الفيزياء": ["الباب الأول: الكميات الفيزيائية ووحدات القياس", "الباب الثاني: الحركة الخطية"],
            "الكيمياء": ["الباب الأول: الكيمياء مركز العلوم", "الباب الثاني: الكيمياء الكمية"],
            "الأحياء": ["الباب الأول: الأساس الكيميائي للحياة", "الباب الثاني: الخلية"],
            "الجغرافيا": ["الوحدة الأولى: الموقع ومظاهر السطح", "الوحدة الثانية: المناخ والحياة النباتية والحيوانية"],
            "التاريخ": ["الوحدة الأولى: مدخل لدراسة حضارة مصر والعالم القديم", "الوحدة الثانية: حضارة مصر القديمة"],
        },
        "الصف الثاني الثانوي": {
             "الشعبة العلمية": {
                "الفيزياء": ["الوحدة الأولى: الموجات", "الوحدة الثانية: خواص الموائع الساكنة"],
                "الكيمياء": ["الوحدة الأولى: بنية الذرة", "الوحدة الثانية: الجدول الدوري وتصنيف العناصر"],
                "الأحياء": ["الوحدة الأولى: التغذية والهضم في الكائنات الحية", "الوحدة الثانية: النقل في الكائنات الحية"],
                "تطبيقات الرياضيات": ["فرع الاستاتيكا", "فرع الهندسة"],
             },
             "الشعبة الأدبية": {
                "الجغرافيا": ["الوحدة الأولى: جغرافية التنمية ومجالاتها", "الوحدة الثانية: جغرافية التنمية والبيئة"],
                "التاريخ": ["الوحدة الأولى: الحضارة العربية وظهور الإسلام", "الوحدة الثانية: الفتوحات الإسلامية"],
                "علم النفس والاجتماع": ["الوحدة الأولى: نشأة علم النفس وتطوره", "الوحدة الأولى: نشأة علم الاجتماع"],
                "الفلسفة والمنطق": ["الوحدة الأولى: طبيعة الموقف الفلسفي", "الوحدة الأولى: مبادئ علم المنطق"],
            }
        },
        "الصف الثالث الثانوي": {
            "شعبة العلوم - علوم": {
                "الفيزياء": ["الوحدة الأولى: الكهربية التياريه وقانون أوم", "الوحدة الثانية: الفيزياء الحديثة"],
                "الكيمياء": ["الوحدة الأولى: العناصر الانتقالية", "الوحدة الثانية: التحليل الكيميائي", "الوحدة الثالثة: الاتزان الكيميائي"],
                "الأحياء": ["الوحدة الأولى: الدعامة والحركة", "الوحدة الثانية: التنسيق الهرموني في الكائنات الحية"],
                "الجيولوجيا وعلوم البيئة": ["الباب الأول: علم الجيولوجيا ومادة الأرض", "الباب الثاني: المعادن"],
            },
            "شعبة العلوم - رياضيات": {
                "الفيزياء": ["الوحدة الأولى: الكهربية التياريه وقانون أوم", "الوحدة الثانية: الفيزياء الحديثة"],
                "الكيمياء": ["الوحدة الأولى: العناصر الانتقالية", "الوحدة الثانية: التحليل الكيميائي", "الوحدة الثالثة: الاتزان الكيميائي"],
                "الجبر والهندسة الفراغية": ["الوحدة الأولى: الجبر", "الوحدة الثانية: الهندسة الفراغية"],
                "التفاضل والتكامل": ["الوحدة الأولى: التفاضل", "الوحدة الثانية: التكامل"],
                "الاستاتيكا": ["الوحدة الأولى: الاحتكاك", "الوحدة الثانية: العزوم"],
                "الديناميكا": ["الوحدة الأولى: تفاضل وتكامل الدوال المتجهة", "الوحدة الثانية: قوانين نيوتن"],
            },
            "الشعبة الأدبية": {
                "الجغرافيا السياسية": ["الوحدة الأولى: الدولة في الجغرافيا السياسية", "الوحدة الثانية: المشكلات السياسية"],
                "التاريخ": ["الوحدة الأولى: الحملة الفرنسية على مصر والشام", "الوحدة الثانية: بناء الدولة الحديثة في مصر"],
                "علم النفس والاجتماع": ["الوحدة الأولى: الذكاء والتعلم", "الوحدة الثانية: علم الاجتماع وقضايا المجتمع"],
                "الفلسفة والمنطق": ["الوحدة الأولى: الفلسفة وقضايا البيئة", "الوحدة الثانية: الاستدلال الاستقرائي وتطبيقه في العلوم"],
            }
        }
    }
};

export interface Metadata {
    grade: string;
    subject: string;
    unit: string;
}

// --- Metadata Form Component ---
const MetadataForm: React.FC<{ onSave: (metadata: Metadata) => void }> = ({ onSave }) => {
    const [selectedStage, setSelectedStage] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');

    const [grades, setGrades] = useState<string[]>([]);
    const [hasBranch, setHasBranch] = useState(false);
    const [branches, setBranches] = useState<string[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [units, setUnits] = useState<string[]>([]);

    // Effect for Stage -> Grades
    useEffect(() => {
        if (selectedStage) {
            setGrades(Object.keys(EGYPTIAN_CURRICULUM[selectedStage]));
        } else {
            setGrades([]);
        }
        // Reset all downstream selections
        setSelectedGrade('');
        setHasBranch(false);
        setBranches([]);
        setSelectedBranch('');
        setSubjects([]);
        setSelectedSubject('');
        setUnits([]);
        setSelectedUnit('');
    }, [selectedStage]);

    // Effect for Grade -> Branches or Subjects
    useEffect(() => {
        let newSubjects: string[] = [];
        let newBranches: string[] = [];
        let gradeHasBranch = false;

        if (selectedStage && selectedGrade) {
            const gradeData = EGYPTIAN_CURRICULUM[selectedStage]?.[selectedGrade];
            if (gradeData) {
                const potentialBranchKeys = Object.keys(gradeData);
                if (potentialBranchKeys.some(k => k.includes('شعبة') || k.includes('الشعبة'))) {
                    gradeHasBranch = true;
                    newBranches = potentialBranchKeys;
                } else {
                    newSubjects = potentialBranchKeys;
                }
            }
        }
        
        setHasBranch(gradeHasBranch);
        setBranches(newBranches);
        setSubjects(newSubjects);
        
        // Reset downstream
        setSelectedBranch('');
        setSelectedSubject('');
        setUnits([]);
        setSelectedUnit('');
    }, [selectedStage, selectedGrade]);

    // Effect for Branch -> Subjects
    useEffect(() => {
        if (!hasBranch) return; 

        let newSubjects: string[] = [];
        if (selectedStage && selectedGrade && selectedBranch) {
            const branchData = EGYPTIAN_CURRICULUM[selectedStage]?.[selectedGrade]?.[selectedBranch];
            if (branchData) {
                newSubjects = Object.keys(branchData);
            }
        }
        setSubjects(newSubjects);

        // Reset downstream
        setSelectedSubject('');
        setUnits([]);
        setSelectedUnit('');
    }, [hasBranch, selectedStage, selectedGrade, selectedBranch]);


    // Effect for Subject -> Units
    useEffect(() => {
        let newUnits: string[] = [];
        if (selectedStage && selectedGrade && selectedSubject) {
            let subjectData;
            if (hasBranch) {
                if (selectedBranch) {
                    subjectData = EGYPTIAN_CURRICULUM[selectedStage]?.[selectedGrade]?.[selectedBranch]?.[selectedSubject];
                }
            } else {
                subjectData = EGYPTIAN_CURRICULUM[selectedStage]?.[selectedGrade]?.[selectedSubject];
            }

            if (subjectData && Array.isArray(subjectData)) {
                newUnits = subjectData;
            }
        }
        setUnits(newUnits);
        setSelectedUnit('');
    }, [hasBranch, selectedStage, selectedGrade, selectedBranch, selectedSubject]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUnit) { // Final check in the chain
            let gradeString = `${selectedStage} - ${selectedGrade}`;
            if (hasBranch && selectedBranch) {
                gradeString += ` - ${selectedBranch}`;
            }
            onSave({ grade: gradeString, subject: selectedSubject, unit: selectedUnit });
        } else {
            alert('يرجى تحديد جميع الخيارات.');
        }
    };
    
    const selectClass = "w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50";
    const gridCols = hasBranch ? 'md:grid-cols-5' : 'md:grid-cols-4';

    return (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
             <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-4`}>
                <div>
                    <label htmlFor="stage-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المرحلة</label>
                    <select id="stage-select" value={selectedStage} onChange={e => setSelectedStage(e.target.value)} className={selectClass}>
                        <option value="">اختر المرحلة...</option>
                        {Object.keys(EGYPTIAN_CURRICULUM).map(stage => <option key={stage} value={stage}>{stage}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="grade-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الصف</label>
                    <select id="grade-select" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className={selectClass} disabled={!selectedStage}>
                        <option value="">اختر الصف...</option>
                        {grades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                    </select>
                </div>
                {hasBranch && (
                     <div>
                        <label htmlFor="branch-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الشعبة</label>
                        <select id="branch-select" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} className={selectClass} disabled={!selectedGrade}>
                            <option value="">اختر الشعبة...</option>
                            {branches.map(branch => <option key={branch} value={branch}>{branch}</option>)}
                        </select>
                    </div>
                )}
                <div>
                    <label htmlFor="subject-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المادة</label>
                    <select id="subject-select" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className={selectClass} disabled={subjects.length === 0}>
                        <option value="">اختر المادة...</option>
                        {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="unit-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الوحدة</label>
                    <select id="unit-select" value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} className={selectClass} disabled={units.length === 0}>
                         <option value="">اختر الوحدة...</option>
                        {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                    </select>
                </div>
             </div>
            <button
                type="submit"
                disabled={!selectedUnit}
                className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed dark:focus:ring-offset-slate-800"
            >
                حفظ وإضافة إلى قائمة الانتظار
            </button>
        </form>
    );
};


// --- Main Card Component ---
interface VideoTranscriptionCardProps {
  fileState: FileState;
  onMetadataSave: (fileId: string, metadata: Metadata) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const VideoTranscriptionCard: React.FC<VideoTranscriptionCardProps> = ({ fileState, onMetadataSave }) => {
  const [copied, setCopied] = useState(false);
  
  const getCleanTranscription = () => fileState.transcription.replace(/<\/?u>/g, '');

  const handleCopy = () => {
    if(!fileState.transcription) return;
    navigator.clipboard.writeText(getCleanTranscription());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if(!fileState.transcription) return;
    const blob = new Blob([getCleanTranscription()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileState.file.name.split('.').slice(0, -1).join('.')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMetadataSave = (metadata: Metadata) => {
    onMetadataSave(fileState.id, metadata);
  };

  const StatusIndicator = () => {
    switch(fileState.status) {
        case 'awaiting_metadata':
            return <span className="text-xs font-medium text-amber-600 dark:text-amber-400">في انتظار تحديد المنهج</span>;
        case 'queued':
            return <span className="text-xs font-medium text-slate-500 dark:text-slate-400">في قائمة الانتظار</span>;
        case 'preparing':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Spinner className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400">جاري الرفع...</span>
                        {fileState.progress !== undefined && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">({fileState.progress}%)</span>
                        )}
                    </div>
                    {fileState.progress !== undefined && (
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                                className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${fileState.progress}%` }}
                            ></div>
                        </div>
                    )}
                </div>
            );
        case 'transcribing':
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Spinner className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs font-medium text-indigo-500 dark:text-indigo-400 animate-pulse">جاري التفريغ...</span>
                        {fileState.progress !== undefined && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">({fileState.progress}%)</span>
                        )}
                    </div>
                    {fileState.progress !== undefined && (
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div 
                                className="bg-indigo-600 dark:bg-indigo-400 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${fileState.progress}%` }}
                            ></div>
                        </div>
                    )}
                </div>
            );
        case 'completed':
            return <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1"><Icon name="check" className="w-4 h-4" /> مكتمل</span>;
        case 'error':
             return <span className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1"><Icon name="alert" className="w-4 h-4" /> خطأ</span>;
    }
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-all">
       <div className="flex justify-between items-start gap-4">
            <div className='flex-grow min-w-0'>
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={fileState.file.name}>{fileState.file.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{formatBytes(fileState.file.size)}</p>
            </div>
            <div className="flex-shrink-0">
                <StatusIndicator />
            </div>
       </div>
       
       {fileState.status === 'awaiting_metadata' && <MetadataForm onSave={handleMetadataSave} />}

       {(fileState.status !== 'awaiting_metadata' && fileState.status !== 'error') && (
            <div className="mt-4">
                 <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white">التفريغ الصوتي</h4>
                    {fileState.status === 'completed' && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition-all"
                                >
                                <Icon name="download" className="w-3.5 h-3.5" />
                                تحميل
                            </button>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition-all"
                                >
                                {copied ? <Icon name="check" className="w-3.5 h-3.5 text-green-500" /> : <Icon name="copy" className="w-3.5 h-3.5" />}
                                {copied ? 'تم النسخ' : 'نسخ'}
                            </button>
                        </div>
                    )}
                </div>
                <TranscriptionDisplay 
                     content={fileState.transcription}
                     placeholder={
                         fileState.status === 'queued' ? 'جاهز للتفريغ...' : 
                         fileState.status === 'transcribing' || fileState.status === 'preparing' ? 'سيظهر التفريغ الصوتي هنا مباشرة...' : ''
                     }
                />
            </div>
        )}

        {fileState.status === 'error' && fileState.error && (
            <div className="mt-4">
                <ErrorMessage message={fileState.error} onClear={() => { /* Error is cleared by clearing all files */}} />
            </div>
        )}

    </div>
  );
};

export default VideoTranscriptionCard;
