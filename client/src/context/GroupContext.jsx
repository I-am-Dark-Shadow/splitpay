import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const GroupContext = createContext();

export const GroupProvider = ({ children }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    if (!user) return;
    
    setLoading(true);

    try {
      // 1. API Call (Real Data)
      const apiCall = api.get('/groups');

      // 2. Minimum Wait Time (5 Seconds)
      const minWait = new Promise(resolve => setTimeout(resolve, 5000));

      // 3. Wait for BOTH to finish
      // Promise.all array-er sobkaj shesh howa por result dey.
      const [response] = await Promise.all([apiCall, minWait]);

      setGroups(response.data);
    } catch (error) {
      console.error("Failed to fetch groups", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  return (
    <GroupContext.Provider value={{ groups, fetchGroups, loading }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => useContext(GroupContext);