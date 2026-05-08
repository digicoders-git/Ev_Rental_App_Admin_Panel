import { useState, useCallback } from 'react';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const call = useCallback(async (apiFn, onSuccess, onError) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFn();
      onSuccess && onSuccess(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong.';
      setError(msg);
      onError && onError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, call };
};

export default useApi;
