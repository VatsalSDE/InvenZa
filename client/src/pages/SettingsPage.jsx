import React, { useState, useEffect } from "react";
import { Settings, Building2, Lock, FileText, AlertTriangle, Eye, EyeOff, Save, Loader2 } from "lucide-react";
import { settingsAPI, authAPI } from "../services/api";
import PageHeader from "../components/ims/PageHeader";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";

const SettingsPage = () => {
    const [company, setCompany] = useState({ name: "Vinayak Lakshmi Gas Stoves", type: "Wholesale Gas Stove Manufacturer", gstin: "", mobile: "", whatsapp: "", email: "", address: "", city: "", state: "", pincode: "" });
    const [billing, setBilling] = useState({ prefix: "BILL", gst_percent: "18", payment_terms: "net30", footer: "" });
    const [passwords, setPasswords] = useState({ current: "", new_password: "", confirm: "" });
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [saved, setSaved] = useState(null);
    const [changingPassword, setChangingPassword] = useState(false);
    const { toasts, showToast, hideToast } = useToast();

    useEffect(() => {
        const s = settingsAPI.getAll();
        if (s.company) setCompany(s.company);
        if (s.billing) setBilling(s.billing);
    }, []);

    const saveCompany = () => { settingsAPI.saveCompany(company); setSaved("company"); setTimeout(() => setSaved(null), 2000); };
    const saveBilling = () => { settingsAPI.saveBilling(billing); setSaved("billing"); setTimeout(() => setSaved(null), 2000); };

    const handleChangePassword = async () => {
        if (!passwords.current || !passwords.new_password) {
            showToast("Please fill in all password fields", "error");
            return;
        }
        if (passwords.new_password !== passwords.confirm) {
            showToast("New passwords do not match", "error");
            return;
        }
        if (passwords.new_password.length < 6) {
            showToast("Password must be at least 6 characters", "error");
            return;
        }
        
        setChangingPassword(true);
        try {
            await authAPI.changePassword({
                current_password: passwords.current,
                new_password: passwords.new_password
            });
            showToast("Password changed successfully!", "success");
            setPasswords({ current: "", new_password: "", confirm: "" });
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to change password", "error");
        } finally {
            setChangingPassword(false);
        }
    };

    const getStrength = (pw) => {
        let s = 0;
        if (pw.length >= 8) s++; if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
        return s;
    };
    const strength = getStrength(passwords.new_password);
    const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
    const strengthLabels = ["Weak", "Fair", "Good", "Strong"];

    const inp = "w-full px-3 py-2 bg-[#222222] border border-[#2A2A2A] text-white text-sm rounded-lg focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 placeholder:text-zinc-600";

    return (
        <div className="min-h-screen bg-[#0F0F0F] p-6">
            <PageHeader title="Settings" subtitle="Manage your account and business" icon={Settings} />
            
            {/* Toast notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {toasts.map(toast => (
                    <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => hideToast(toast.id)} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Info */}
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-4 h-4 text-green-400" />
                        <h2 className="text-base font-medium text-white">Company Information</h2>
                    </div>
                    <p className="text-xs text-zinc-600 mb-4">These details appear on every bill and ledger.</p>
                    <div className="space-y-3">
                        <input type="text" placeholder="Company Name" value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} className={inp} />
                        <input type="text" placeholder="Business Type / Tagline" value={company.type} onChange={e => setCompany({ ...company, type: e.target.value })} className={inp} />
                        <input type="text" placeholder="GSTIN" value={company.gstin} onChange={e => setCompany({ ...company, gstin: e.target.value })} className={inp} />
                        <div className="grid grid-cols-2 gap-3">
                            <input type="tel" placeholder="Mobile" value={company.mobile} onChange={e => setCompany({ ...company, mobile: e.target.value })} className={inp} />
                            <input type="tel" placeholder="WhatsApp Number" value={company.whatsapp} onChange={e => setCompany({ ...company, whatsapp: e.target.value })} className={inp} />
                        </div>
                        <input type="email" placeholder="Email" value={company.email} onChange={e => setCompany({ ...company, email: e.target.value })} className={inp} />
                        <textarea placeholder="Full Address" value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} rows="2" className={inp} />
                        <div className="grid grid-cols-3 gap-3">
                            <input type="text" placeholder="City" value={company.city} onChange={e => setCompany({ ...company, city: e.target.value })} className={inp} />
                            <input type="text" placeholder="State" value={company.state} onChange={e => setCompany({ ...company, state: e.target.value })} className={inp} />
                            <input type="text" placeholder="Pincode" value={company.pincode} onChange={e => setCompany({ ...company, pincode: e.target.value })} className={inp} />
                        </div>
                    </div>
                    <button onClick={saveCompany} className="w-full mt-4 bg-green-500 hover:bg-green-600 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                        <Save className="w-4 h-4" /> {saved === "company" ? "Saved ✓" : "Save Company Info"}
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Change Password */}
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Lock className="w-4 h-4 text-green-400" />
                            <h2 className="text-base font-medium text-white">Change Password</h2>
                        </div>
                        <div className="space-y-3">
                            <div className="relative">
                                <input type={showCurrent ? "text" : "password"} placeholder="Current Password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} className={inp} />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="relative">
                                <input type={showNew ? "text" : "password"} placeholder="New Password" value={passwords.new_password} onChange={e => setPasswords({ ...passwords, new_password: e.target.value })} className={inp} />
                                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {passwords.new_password && (
                                <div>
                                    <div className="flex gap-1 mb-1">
                                        {[0, 1, 2, 3].map(i => (<div key={i} className={`h-1 flex-1 rounded-full ${i < strength ? strengthColors[strength - 1] : 'bg-zinc-800'}`} />))}
                                    </div>
                                    <p className={`text-xs ${strength <= 1 ? 'text-red-400' : strength === 2 ? 'text-orange-400' : strength === 3 ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {strengthLabels[strength - 1] || ""}
                                    </p>
                                </div>
                            )}
                            <input type="password" placeholder="Confirm New Password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} className={inp} />
                        </div>
                        <button onClick={handleChangePassword} disabled={changingPassword} className="w-full mt-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                            {changingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : "Update Password"}
                        </button>
                    </div>

                    {/* Billing Preferences */}
                    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-4 h-4 text-green-400" />
                            <h2 className="text-base font-medium text-white">Billing Preferences</h2>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">Bill Prefix</label>
                                <input type="text" value={billing.prefix} onChange={e => setBilling({ ...billing, prefix: e.target.value })} className={inp} />
                                <p className="text-xs text-zinc-600 mt-1">Preview: <span className="text-zinc-400">{billing.prefix}-250305-001</span></p>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">Default GST %</label>
                                <input type="number" value={billing.gst_percent} onChange={e => setBilling({ ...billing, gst_percent: e.target.value })} className={inp} />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">Default Payment Terms</label>
                                <select value={billing.payment_terms} onChange={e => setBilling({ ...billing, payment_terms: e.target.value })} className={inp}>
                                    <option value="immediate">Immediate</option>
                                    <option value="net15">Net 15</option>
                                    <option value="net30">Net 30</option>
                                    <option value="net60">Net 60</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">Bill Footer Message</label>
                                <textarea value={billing.footer} onChange={e => setBilling({ ...billing, footer: e.target.value })} rows="2" placeholder="Thank you for your business!" className={inp} />
                            </div>
                        </div>
                        <button onClick={saveBilling} className="w-full mt-4 bg-green-500 hover:bg-green-600 text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                            <Save className="w-4 h-4" /> {saved === "billing" ? "Saved ✓" : "Save Preferences"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-6 bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <h2 className="text-base font-medium text-red-400">Danger Zone</h2>
                </div>
                <p className="text-sm text-zinc-500 mb-4">Reset all demo/test data. This action cannot be undone.</p>
                <button onClick={() => { if (window.confirm("Are you sure? This will clear ALL localStorage data.")) { localStorage.clear(); window.location.reload(); } }}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                    Reset Demo Data
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;
