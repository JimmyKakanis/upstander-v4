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
      const schoolList = schoolSnapshot.docs.map(doc => doc.data() as School);
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
    <div className="w-full max-w-md mx-auto">
      <input
        type="text"
        placeholder="Search for your school..."
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <ul className="mt-2 border border-gray-200 rounded-md bg-white shadow-lg">
          {filteredSchools.map(school => (
            <li
              key={school.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSchoolSelect(school.id)}
            >
              {school.name}
            </li>
          ))}
          {filteredSchools.length === 0 && (
            <li className="px-4 py-2 text-gray-500">No schools found</li>
          )}
        </ul>
      )}
    </div>
  );
}
