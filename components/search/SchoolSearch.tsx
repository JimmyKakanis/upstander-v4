"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface School {
  id: string;
  name: string;
}

export default function SchoolSearch() {
  const [schools, setSchools] = useState<School[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchSchools = async () => {
      const schoolsCollection = collection(db, 'schools');
      const schoolSnapshot = await getDocs(schoolsCollection);
      const schoolList = schoolSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as School);

      setSchools(schoolList);
      setFilteredSchools(schoolList);
    };

    fetchSchools();
  }, []);

  useEffect(() => {
    const results = schools.filter(school =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredSchools(results);
  }, [searchTerm, schools]);

  const handleSchoolSelect = (schoolId: string) => {
    router.push(`/report/${schoolId}`);
  };

  return (
    <div className="mx-auto w-full max-w-md text-left">
      <label htmlFor="school-search" className="sr-only">
        Search for your school
      </label>
      <input
        id="school-search"
        type="text"
        placeholder="Search for your school…"
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        autoComplete="off"
      />
      {searchTerm ? (
        <ul
          className="mt-2 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-900/5"
          role="listbox"
        >
          {filteredSchools.map(school => (
            <li
              key={school.id}
              role="option"
              className="cursor-pointer px-4 py-2.5 text-sm text-slate-800 transition-colors hover:bg-slate-50"
              onClick={() => handleSchoolSelect(school.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSchoolSelect(school.id);
                }
              }}
              tabIndex={0}
            >
              {school.name}
            </li>
          ))}
          {filteredSchools.length === 0 && (
            <li className="px-4 py-3 text-center text-sm text-slate-500">No schools found.</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
