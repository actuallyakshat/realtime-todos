import { useEffect, useState } from "react";
import api from "../lib/axios";

const useFetch = <T,>(url: string, options?: object) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get<T>(url, options);
        if (isMounted) setData(response.data);
      } catch (err) {
        const e = err as Error;
        if (isMounted) setError(e.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [url, options]); // Remove options from dependency array

  return { data, error, loading };
};

export default useFetch;
