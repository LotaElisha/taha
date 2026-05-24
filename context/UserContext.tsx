import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '../types';
import { getAllMockUsers } from '../data/mockData';

interface UserContextType {
  users: User[];
  addUser: (user: User) => void;
  updateUser: (updatedUser: User) => void;
  deleteUser: (userId: string) => void;
  bulkDeleteUsers: (userIds: string[]) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(getAllMockUsers());

  const addUser = (user: User) => {
    setUsers(prevUsers => [user, ...prevUsers]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prevUsers =>
      prevUsers.map(user => (user.id === updatedUser.id ? updatedUser : user))
    );
  };

  const deleteUser = (userId: string) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  };

  const bulkDeleteUsers = (userIds: string[]) => {
    setUsers(prevUsers => prevUsers.filter(user => !userIds.includes(user.id)));
  };

  return (
    <UserContext.Provider value={{ users, addUser, updateUser, deleteUser, bulkDeleteUsers }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};