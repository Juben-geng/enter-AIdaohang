import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
}

interface Link {
  id: string;
  category_id: string;
  title: string;
  url: string;
  description: string | null;
  icon: string | null;
  link_type: string;
  sort_order: number;
  click_count: number;
}

const CATEGORIES_KEY = 'local_categories';
const LINKS_KEY = 'local_links';

export function useLocalStorage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const savedCategories = localStorage.getItem(CATEGORIES_KEY);
      const savedLinks = localStorage.getItem(LINKS_KEY);
      
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      }
      if (savedLinks) {
        setLinks(JSON.parse(savedLinks));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  const saveCategoriesToLocal = (newCategories: Category[]) => {
    setCategories(newCategories);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCategories));
  };

  const saveLinksToLocal = (newLinks: Link[]) => {
    setLinks(newLinks);
    localStorage.setItem(LINKS_KEY, JSON.stringify(newLinks));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = {
      ...category,
      id: Date.now().toString(),
    };
    const newCategories = [...categories, newCategory];
    saveCategoriesToLocal(newCategories);
    return newCategory;
  };

  const deleteCategory = (categoryId: string) => {
    const newCategories = categories.filter((c) => c.id !== categoryId);
    const newLinks = links.filter((l) => l.category_id !== categoryId);
    saveCategoriesToLocal(newCategories);
    saveLinksToLocal(newLinks);
  };

  const addLink = (link: Omit<Link, 'id' | 'click_count'>) => {
    const newLink = {
      ...link,
      id: Date.now().toString(),
      click_count: 0,
    };
    const newLinks = [...links, newLink];
    saveLinksToLocal(newLinks);
    return newLink;
  };

  const deleteLink = (linkId: string) => {
    const newLinks = links.filter((l) => l.id !== linkId);
    saveLinksToLocal(newLinks);
  };

  const updateLinkClickCount = (linkId: string) => {
    const newLinks = links.map((l) =>
      l.id === linkId ? { ...l, click_count: l.click_count + 1 } : l
    );
    saveLinksToLocal(newLinks);
  };

  const getLinksByCategory = (categoryId: string) => {
    return links.filter((l) => l.category_id === categoryId);
  };

  const clearLocalData = () => {
    localStorage.removeItem(CATEGORIES_KEY);
    localStorage.removeItem(LINKS_KEY);
    setCategories([]);
    setLinks([]);
  };

  const exportLocalData = () => {
    return {
      categories,
      links,
    };
  };

  return {
    categories,
    links,
    addCategory,
    deleteCategory,
    addLink,
    deleteLink,
    updateLinkClickCount,
    getLinksByCategory,
    clearLocalData,
    exportLocalData,
  };
}