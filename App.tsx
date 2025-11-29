import React, { useState } from 'react';
import { ProfileForm } from './components/ProfileForm';
import { LiveAdvisor } from './components/LiveAdvisor';
import { UserProfile, AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('setup');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const handleStartSession = (profile: UserProfile) => {
    setUserProfile(profile);
    setAppState('active');
  };

  const handleEndSession = () => {
    setAppState('setup');
    // Optional: clear profile if you want them to re-enter data every time
    // setUserProfile(null); 
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {appState === 'setup' && (
        <div className="container mx-auto px-4 py-12">
          <ProfileForm onStart={handleStartSession} />
        </div>
      )}

      {appState === 'active' && userProfile && (
        <LiveAdvisor 
          profile={userProfile} 
          onEndSession={handleEndSession} 
        />
      )}
    </div>
  );
};

export default App;