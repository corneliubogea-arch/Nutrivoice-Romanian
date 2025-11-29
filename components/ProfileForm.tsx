import React, { useState, useEffect } from 'react';
import { UserProfile, Sex, Lifestyle } from '../types';
import { ChefHat, Activity, Scale, Ruler, User, Save, Trash2, CheckCircle } from 'lucide-react';

interface ProfileFormProps {
  onStart: (profile: UserProfile) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onStart }) => {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    sex: Sex.Female,
    age: 30,
    weight: 70,
    height: 170,
    lifestyle: Lifestyle.Moderate,
    dietaryPreferences: ''
  });

  const [savedProfiles, setSavedProfiles] = useState<UserProfile[]>([]);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Load saved profiles
    const stored = localStorage.getItem('nutrivoice_profiles');
    if (stored) {
      try {
        setSavedProfiles(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse profiles', e);
      }
    }

    // Load last used profile
    const lastUsed = localStorage.getItem('nutrivoice_last_used_profile');
    if (lastUsed) {
      try {
        const parsedLast = JSON.parse(lastUsed);
        setProfile(prev => ({ ...prev, ...parsedLast }));
      } catch (e) {
        console.error('Failed to parse last used profile', e);
      }
    }
  }, []);

  const handleSaveProfile = () => {
    if (!profile.name.trim()) {
        setSaveMessage('Introduceți un nume.');
        setTimeout(() => setSaveMessage(''), 3000);
        return;
    }

    // Generate ID if new, keep existing if updating
    const newId = profile.id || Date.now().toString();
    const profileToSave = { ...profile, id: newId };
    
    const existingIndex = savedProfiles.findIndex(p => p.id === newId);
    let updatedList;
    
    if (existingIndex >= 0) {
        updatedList = [...savedProfiles];
        updatedList[existingIndex] = profileToSave;
    } else {
        updatedList = [...savedProfiles, profileToSave];
    }
    
    setSavedProfiles(updatedList);
    localStorage.setItem('nutrivoice_profiles', JSON.stringify(updatedList));
    setProfile(profileToSave);
    
    // Also update last used
    localStorage.setItem('nutrivoice_last_used_profile', JSON.stringify(profileToSave));
    
    setSaveMessage('Profil Salvat!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Sigur doriți să ștergeți acest profil?")) return;
    
    const updatedList = savedProfiles.filter(p => p.id !== id);
    setSavedProfiles(updatedList);
    localStorage.setItem('nutrivoice_profiles', JSON.stringify(updatedList));
    
    // If currently selected profile is deleted, remove ID from form to avoid ghost updates
    if (profile.id === id) {
        const { id: _, ...rest } = profile;
        setProfile(rest as UserProfile);
        localStorage.removeItem('nutrivoice_last_used_profile');
    }
  };

  const handleSelectProfile = (p: UserProfile) => {
    setProfile(p);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save as last used
    localStorage.setItem('nutrivoice_last_used_profile', JSON.stringify(profile));
    onStart(profile);
  };

  const handleChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* Saved Profiles Section */}
      {savedProfiles.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <User size={20} className="text-emerald-600"/> Profile Salvate
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedProfiles.map((p) => (
                    <div 
                        key={p.id}
                        onClick={() => handleSelectProfile(p)}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md group ${
                            profile.id === p.id 
                            ? 'border-emerald-500 bg-emerald-50' 
                            : 'border-slate-100 bg-white hover:border-emerald-200'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-bold text-slate-800">{p.name}</div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {p.sex}, {p.age} ani
                                </div>
                            </div>
                            <button
                                onClick={(e) => handleDeleteProfile(p.id!, e)}
                                className="text-slate-300 hover:text-red-500 transition p-1 rounded-full hover:bg-red-50"
                                title="Șterge profil"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-emerald-600 p-6 text-white text-center">
            <div className="flex justify-center mb-4">
                <div className="p-3 bg-white/20 rounded-full">
                    <ChefHat size={40} />
                </div>
            </div>
            <h1 className="text-2xl font-bold">NutriVoice Advisor</h1>
            <p className="text-emerald-100 mt-2">Configurați profilul pentru sfaturi personalizate</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User size={16} /> Nume
                </label>
                <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition bg-teal-50"
                placeholder="Maria Popescu"
                />
            </div>

            {/* Age */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Vârstă</label>
                <input
                type="number"
                min="10"
                max="100"
                required
                value={profile.age}
                onChange={(e) => handleChange('age', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-teal-50"
                />
            </div>

            {/* Sex */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sex</label>
                <select
                value={profile.sex}
                onChange={(e) => handleChange('sex', e.target.value as Sex)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-teal-50"
                >
                {Object.values(Sex).map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
                </select>
            </div>

            {/* Lifestyle */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Activity size={16} /> Stil de viață
                </label>
                <select
                value={profile.lifestyle}
                onChange={(e) => handleChange('lifestyle', e.target.value as Lifestyle)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-teal-50"
                >
                {Object.values(Lifestyle).map((l) => (
                    <option key={l} value={l}>{l}</option>
                ))}
                </select>
            </div>

            {/* Weight */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Scale size={16} /> Greutate (kg)
                </label>
                <input
                type="number"
                min="20"
                max="300"
                required
                value={profile.weight}
                onChange={(e) => handleChange('weight', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-teal-50"
                />
            </div>

            {/* Height */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Ruler size={16} /> Înălțime (cm)
                </label>
                <input
                type="number"
                min="100"
                max="250"
                required
                value={profile.height}
                onChange={(e) => handleChange('height', parseInt(e.target.value))}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-teal-50"
                />
            </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Preferințe dietetice sau alergii</label>
            <textarea
                rows={3}
                value={profile.dietaryPreferences}
                onChange={(e) => handleChange('dietaryPreferences', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none bg-teal-50"
                placeholder="Ex: Vegetarian, alergie la nuci, vreau să slăbesc..."
            />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="flex-1 bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    {saveMessage ? <CheckCircle size={20} /> : <Save size={20} />}
                    {saveMessage || 'Salvează Profil'}
                </button>
                <button
                    type="submit"
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    Începe Conversația
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};