import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download, PenLine, RotateCcw } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { getContractById, signContract } from '../api/contracts';
import BrandLogo from '../components/BrandLogo';

const COMPANY = {
  name: 'SAMUELTECH INSTALLATIONS (PRIVATE) LIMITED',
  registration: '76520A0212026',
  physicalAddress: '735 Retreat Waterfalls Harare',
  email: 'support@starconnectafrica.com',
  brand: 'StarConnect Africa',
};

const ARTICLES = [
  {
    title: 'ARTICLE 1: DEFINITIONS AND INTERPRETATION',
    items: [
      '"Equipment" means the Starlink satellite dish, router, mounting hardware, cables, and all associated components supplied under this Agreement.',
      '"Service" means the Starlink satellite internet connectivity service accessed through the Equipment.',
      '"Installation" means the professional setup and configuration of the Equipment at the Customer\'s premises.',
      '"Payment Plan" means the 8-week EcoCash instalment payment arrangement as detailed in Schedule A.',
      '"Monthly Subscription" means the recurring Starlink service fee payable directly to SpaceX/Starlink.',
    ],
  },
  {
    title: 'ARTICLE 2: SCOPE OF SERVICES',
    paragraphs: [
      'The Company agrees to provide the Customer with one complete Starlink equipment kit, professional installation, initial configuration, customer training, and technical support during the stated warranty period.',
      'The Customer acknowledges that the monthly Starlink subscription fee is payable directly to SpaceX/Starlink and is separate from payments made to the Company under this Agreement.',
    ],
  },
  {
    title: 'ARTICLE 3: PAYMENT TERMS',
    paragraphs: [
      'Payment shall be made in accordance with the 8-week repayment plan. The initial deposit is due upon signing of this Agreement and prior to equipment dispatch.',
      'Payments shall be made via EcoCash to the Company\'s registered merchant account or such other payment method as may be agreed in writing.',
    ],
  },
  {
    title: 'ARTICLE 4: INSTALLATION',
    paragraphs: [
      'Installation shall be scheduled within five business days of deposit confirmation, subject to equipment availability and Customer readiness.',
      'The Customer shall ensure clear site access, stable electrical power, property-owner permission where applicable, and the presence of an authorised adult during installation.',
    ],
  },
  {
    title: 'ARTICLE 5: OWNERSHIP AND SECURITY INTEREST',
    paragraphs: [
      'Title to the Equipment remains with the Company until all payments under this Agreement have been received in full.',
      'The Customer shall not dispose of or encumber the Equipment until full payment has been made.',
    ],
  },
  {
    title: 'ARTICLE 6: WARRANTY',
    paragraphs: [
      'The Equipment is covered by the manufacturer\'s warranty as provided by SpaceX/Starlink. The Company provides an additional 90-day installation workmanship warranty.',
      'Warranty does not cover lightning, power surges, natural disasters, misuse, unauthorised modifications, network outages, or normal wear and tear.',
    ],
  },
  {
    title: 'ARTICLE 7: DEFAULT AND REMEDIES',
    paragraphs: [
      'The Customer shall be in default if any scheduled payment is more than fourteen days overdue, if a material term is breached, or if the Equipment is damaged or disposed of without authorisation.',
      'Upon default, the Company may declare all remaining payments due, repossess the Equipment, apply late fees, and pursue legal remedies.',
    ],
  },
  {
    title: 'ARTICLE 8: LIMITATION OF LIABILITY',
    paragraphs: [
      'The Company\'s liability under this Agreement is limited to the total contract value paid by the Customer.',
      'The Company is not liable for indirect, consequential, or incidental damages and does not guarantee specific internet speeds or uninterrupted service.',
    ],
  },
  {
    title: 'ARTICLE 9: GOVERNING LAW AND DISPUTE RESOLUTION',
    paragraphs: [
      'This Agreement is governed by the laws of Zimbabwe. Any dispute shall first be submitted to mediation before legal action, and the parties submit to the exclusive jurisdiction of the courts of Zimbabwe.',
    ],
  },
  {
    title: 'ARTICLE 10: GENERAL PROVISIONS',
    paragraphs: [
      'This Agreement, together with its schedules, constitutes the entire agreement between the parties. Any amendment must be in writing and signed by both parties.',
      'If any provision is invalid, the remaining provisions continue in full force and effect.',
    ],
  },
];

function formatDate(value) {
  if (!value) return '____________';
  return new Date(value).toLocaleDateString('en-ZW', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function SignatureCanvas({ onChange }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (event) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const point = getPoint(event);

    drawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const draw = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const point = getPoint(event);

    context.lineWidth = 2;
    context.lineCap = 'round';
    context.strokeStyle = '#0f172a';
    context.lineTo(point.x, point.y);
    context.stroke();
    onChange(canvas.toDataURL('image/png'));
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={640}
        height={180}
        className="w-full rounded-2xl border border-slate-200 bg-white touch-none shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <button
        type="button"
        onClick={clear}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
      >
        <RotateCcw size={14} /> Clear signature
      </button>
    </div>
  );
}

export default function ContractDocument() {
  const { id } = useParams();
  const { user } = useAuth();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [witnessIdNumber, setWitnessIdNumber] = useState('');

  const isCustomer = user?.role === 'Customer';
  const canSign = isCustomer && contract && !contract.customerSigned;

  const loadContract = async () => {
    try {
      const { data } = await getContractById(id);
      setContract(data);
      setSignatureName(data.customer?.fullName || user?.name || '');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load contract');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContract();
  }, [id]);

  const handleSign = async (e) => {
    e.preventDefault();
    if (!signatureDataUrl) {
      toast.error('Please sign before submitting');
      return;
    }

    setSaving(true);
    try {
      const { data } = await signContract(id, {
        signatureDataUrl,
        signatureName,
        witnessName,
        witnessIdNumber,
      });
      setContract(data.contract);
      toast.success('Contract signed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sign contract');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Contract not found. <Link to="/contracts" className="text-blue-600 hover:underline">Back to contracts</Link>
      </div>
    );
  }

  const companySigner = contract.createdBy?.name || 'Authorized Representative';
  const agreementDate = contract.agreementDate || contract.createdAt;
  const application = contract.application;
  const customer = contract.customer;
  const packageInfo = contract.package;

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_right,rgba(21,169,231,0.10),transparent_28%),radial-gradient(circle_at_top_left,rgba(26,182,108,0.08),transparent_22%),#eef5fb]">
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/70 bg-white/85 px-6 py-4 backdrop-blur-xl">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{contract.contractRef}</h1>
          <p className="text-sm text-slate-500">StarConnect Africa service agreement</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/contracts" className="text-sm text-slate-600 hover:text-slate-900">Back</Link>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--brand-navy)] to-[var(--brand-cyan)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_16px_30px_rgba(23,63,143,0.22)]"
          >
            <Download size={16} /> Download / Print
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 print:p-0">
        <article className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 text-[15px] leading-7 text-slate-800 shadow-[0_26px_70px_rgba(15,23,42,0.10)] print:rounded-none print:border-0 print:shadow-none">
          <header className="border-b border-slate-200/70 bg-gradient-to-r from-[var(--brand-navy)] via-[var(--brand-navy)] to-[var(--brand-cyan)] px-8 py-8 text-white print:bg-none print:text-slate-900">
            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
              <div>
                <div className="max-w-md rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl print:border-slate-200 print:bg-slate-50">
                  <BrandLogo />
                </div>
                <p className="mt-5 text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-white/70 print:text-slate-400">Customer Service Agreement v1.0</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">Starlink Installation Service Agreement</h1>
              </div>

              <div className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur-xl print:border-slate-200 print:bg-white">
                <div className="space-y-2 text-sm text-white/90 print:text-slate-700">
                  <p><strong>Contract Reference:</strong> {contract.contractRef}</p>
                  <p><strong>Agreement Date:</strong> {formatDate(agreementDate)}</p>
                  <p><strong>Application Reference:</strong> {application?.applicationNo || '____________'}</p>
                  <p><strong>Status:</strong> {contract.status}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-8 md:p-10 print:p-0">
          <section className="mb-10 space-y-6">
            <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900">Parties To This Agreement</h2>
            <p>
              This Service Agreement (the &quot;Agreement&quot;) is entered into on {formatDate(agreementDate)} between:
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[1.6rem] border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
                <p className="font-semibold text-slate-900">{COMPANY.name}</p>
                <p>({COMPANY.registration})</p>
                <p>Physical Address: {COMPANY.physicalAddress}</p>
                <p>Email: {COMPANY.email}</p>
                <p className="mt-3 text-sm text-slate-500">(Hereinafter referred to as &quot;the Company&quot; or {COMPANY.brand})</p>
              </div>
              <div className="rounded-[1.6rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
                <p><strong>Full Name/Company Name:</strong> {customer?.fullName || '____________'}</p>
                <p><strong>ID Number/Registration:</strong> {customer?.idNumber || '____________'}</p>
                <p><strong>Physical Address:</strong> {customer?.physicalAddress || '____________'}</p>
                <p><strong>Phone Number:</strong> {customer?.phonePrimary || '____________'}</p>
                <p><strong>Email Address:</strong> {customer?.email || '____________'}</p>
                <p><strong>EcoCash Number:</strong> {application?.ecocash?.number || '____________'}</p>
                <p className="mt-3 text-sm text-slate-500">(Hereinafter referred to as &quot;the Customer&quot;)</p>
              </div>
            </div>
            <p>
              WHEREAS the Company is an authorised installer of Starlink satellite internet equipment and services in Zimbabwe, and the Customer wishes to acquire such equipment and services under the terms set forth herein.
            </p>
          </section>

          <section className="space-y-8">
            {ARTICLES.map((article) => (
              <div key={article.title}>
                <h3 className="mb-3 text-base font-semibold tracking-[-0.02em] text-slate-900">{article.title}</h3>
                {article.items ? (
                  <ol className="list-decimal pl-5 space-y-2">
                    {article.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                ) : null}
                {article.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mb-2">{paragraph}</p>
                ))}
                {article.title === 'ARTICLE 3: PAYMENT TERMS' ? (
                  <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
                    <div className="border-b border-slate-200/70 px-5 py-4">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--brand-cyan)]">Schedule A</p>
                      <h4 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-slate-900">Payment Summary</h4>
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        <tr className="border-b border-slate-200/70">
                          <td className="px-5 py-4 font-medium text-slate-600">Package</td>
                          <td className="px-5 py-4 font-semibold text-slate-900">{packageInfo?.name || 'Starlink Equipment'}</td>
                        </tr>
                        <tr className="border-b border-slate-200/70">
                          <td className="px-5 py-4 font-medium text-slate-600">Initial Deposit</td>
                          <td className="px-5 py-4 font-semibold text-slate-900">USD {contract.depositAmount?.toFixed(2)}</td>
                        </tr>
                        <tr className="border-b border-slate-200/70">
                          <td className="px-5 py-4 font-medium text-slate-600">Weekly Instalment</td>
                          <td className="px-5 py-4 font-semibold text-slate-900">USD {contract.weeklyInstallment?.toFixed(2)} x {contract.durationWeeks}</td>
                        </tr>
                        <tr className="bg-slate-50/70">
                          <td className="px-5 py-4 font-semibold text-slate-900">Total Contract Value</td>
                          <td className="px-5 py-4 font-semibold text-slate-900">USD {contract.totalContractValue?.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ))}
          </section>

          <section className="mt-12">
            <h2 className="mb-4 text-lg font-semibold tracking-[-0.03em] text-slate-900">Signatures</h2>
            <p className="mb-6">The parties hereto have executed this Agreement as of the date first written above.</p>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="rounded-[1.6rem] border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
                <p className="mb-4 font-semibold text-slate-900">For And On Behalf Of {COMPANY.name}</p>
                <p><strong>Name:</strong> {companySigner}</p>
                <p><strong>Title:</strong> Contract Administrator</p>
                <p><strong>Date:</strong> {formatDate(agreementDate)}</p>
              </div>

              <div className="rounded-[1.6rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
                <p className="mb-4 font-semibold text-slate-900">Customer</p>
                {contract.customerSigned && contract.customerSignatureDataUrl ? (
                  <img
                    src={contract.customerSignatureDataUrl}
                    alt="Customer signature"
                    className="mb-3 h-20 object-contain border-b border-slate-200"
                  />
                ) : (
                  <div className="mb-3 h-20 border-b border-dashed border-slate-300" />
                )}
                <p><strong>Full Name:</strong> {contract.customerSignatureName || customer?.fullName || '____________'}</p>
                <p><strong>ID Number:</strong> {customer?.idNumber || '____________'}</p>
                <p><strong>Date:</strong> {formatDate(contract.customerSignedAt || agreementDate)}</p>
              </div>
            </div>

            <div className="mt-8 rounded-[1.6rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
              <p className="mb-3 font-semibold text-slate-900">Witness</p>
              <p><strong>Full Name:</strong> {contract.witnessName || '____________'}</p>
              <p><strong>ID Number:</strong> {contract.witnessIdNumber || '____________'}</p>
              <p><strong>Date:</strong> {formatDate(contract.witnessSignedAt)}</p>
            </div>
          </section>
          </div>
        </article>

        {canSign && (
          <form onSubmit={handleSign} className="print:hidden mt-6 space-y-5 rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_22px_56px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(21,169,231,0.10)] text-[var(--brand-cyan)]">
                <PenLine size={18} />
              </span>
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-900">Sign Contract Online</h2>
            </div>
            <p className="text-sm text-slate-500">
              Draw your signature below, then save. After signing, use Download / Print to keep a copy.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Customer Name</span>
                <input
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-cyan)]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Witness Name (optional)</span>
                <input
                  value={witnessName}
                  onChange={(e) => setWitnessName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-cyan)]"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Witness ID Number (optional)</span>
                <input
                  value={witnessIdNumber}
                  onChange={(e) => setWitnessIdNumber(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-cyan)]"
                />
              </label>
            </div>
            <SignatureCanvas onChange={setSignatureDataUrl} />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--brand-navy)] to-[var(--brand-cyan)] px-5 py-3 text-sm font-medium text-white shadow-[0_16px_30px_rgba(23,63,143,0.22)] disabled:opacity-60"
            >
              {saving ? <Spinner size="sm" /> : <PenLine size={16} />}
              {saving ? 'Saving Signature...' : 'Sign Contract'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
