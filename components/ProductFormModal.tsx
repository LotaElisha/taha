// src/components/ProductFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Product, Agrodealer, User, Agrovet } from '../types';
import BarcodeScannerModal from './BarcodeScannerModal';
import { toast } from './ui/sonner';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  productToEdit?: Product | null;
  vendors?: (Agrodealer | Agrovet)[]; // For Admin to select a vendor
  currentUser?: User | null; // For Agrodealer/Agrovet to auto-assign vendor
}

const EMPTY_VENDORS: (Agrodealer | Agrovet)[] = []; // Stable reference for default prop value

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  vendors = EMPTY_VENDORS,
  currentUser
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: 'Seeds',
    stock: 0,
    vendor: undefined,
    barcode: '',
    imageUrl: '',
  });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);


  useEffect(() => {
    if (productToEdit) {
      setFormData({
        id: productToEdit.id,
        name: productToEdit.name,
        description: productToEdit.description,
        price: productToEdit.price,
        category: productToEdit.category,
        stock: productToEdit.stock,
        vendor: productToEdit.vendor,
        barcode: productToEdit.barcode || '',
        imageUrl: productToEdit.imageUrl,
      });
      setImagePreview(productToEdit.imageUrl || null);
    } else {
      // Reset form for new product
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: 'Seeds',
        stock: 0,
        vendor: (currentUser?.role === 'Agrodealer' || currentUser?.role === 'Agrovet') ? (currentUser as Agrodealer | Agrovet) : vendors[0],
        barcode: '',
        imageUrl: '',
      });
      setImagePreview(null);
    }
    setImageFile(null); // Reset file object on open/close
  }, [productToEdit, isOpen, currentUser, vendors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'vendor') {
        const selectedVendor = vendors.find(v => v.id === value);
        setFormData(prev => ({ ...prev, vendor: selectedVendor }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanSuccess = (scannedCode: string) => {
    setFormData(prev => ({ ...prev, barcode: scannedCode }));
    setIsScannerOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.stock || !formData.vendor) {
        toast.error('Please fill in all required fields.');
        return;
    }

    // Simulate image upload
    let imageUrl = productToEdit?.imageUrl || '';
    if (imageFile) {
        // In a real app, you'd upload 'imageFile' here and get a URL in response.
        // For this demo, we'll just generate a new random placeholder URL.
        imageUrl = `https://picsum.photos/seed/${formData.name}-${Date.now()}/400/400`;
    }

    const productData: Product = {
      id: productToEdit?.id || `p${Date.now()}`,
      name: formData.name,
      description: formData.description || '',
      price: Number(formData.price),
      category: formData.category || 'Seeds',
      imageUrl: imageUrl,
      vendor: formData.vendor,
      stock: Number(formData.stock),
      barcode: formData.barcode,
    };

    onSave(productData);
  };
  
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="p-6 border-b dark:border-gray-700">
            <h2 className="text-2xl font-bold text-brand-green-dark dark:text-gray-100">
              {productToEdit ? 'Edit Product' : 'Create New Product'}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Image</label>
              <div className="mt-1 flex items-center space-x-4">
                  <div className="flex-shrink-0 h-24 w-24 rounded-md bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                      {imagePreview ? (
                          <img src={imagePreview} alt="Product preview" className="h-full w-full object-cover" />
                      ) : (
                          <svg className="h-12 w-12 text-gray-300 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                      )}
                  </div>
                  <input type="file" id="imageUpload" accept="image/png, image/jpeg" onChange={handleImageChange} className="hidden" />
                  <label htmlFor="imageUpload" className="cursor-pointer bg-white dark:bg-gray-600 py-2 px-3 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green">
                      Change
                  </label>
              </div>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            
            {vendors.length > 0 && currentUser?.role === 'Admin' && (
              <div>
                  <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vendor</label>
                  <select name="vendor" id="vendor" value={formData.vendor?.id} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.role})</option>)}
                  </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price (Tsh)</label>
                <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock Quantity</label>
                <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} required min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
            
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Barcode / SKU</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input type="text" name="barcode" id="barcode" value={formData.barcode || ''} onChange={handleChange} className="focus:ring-brand-green focus:border-brand-green flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Scan or enter code" />
                <button type="button" onClick={() => setIsScannerOpen(true)} className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M4 7v-1a2 2 0 0 1 2 -2h2"></path><path d="M4 17v1a2 2 0 0 0 2 2h2"></path><path d="M16 4h2a2 2 0 0 1 2 2v1"></path><path d="M16 20h2a2 2 0 0 0 2 -2v-1"></path><path d="M5 11h1v2h-1z"></path><path d="M10 11l0 2"></path><path d="M14 11h1v2h-1z"></path><path d="M19 11l0 2"></path></svg>
                  <span>Scan</span>
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <select name="category" id="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option>Seeds</option>
                <option>Fertilizers</option>
                <option>Pesticides</option>
                <option>Tools</option>
                <option>Animal Medicine</option>
                <option>Agrovet Services</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
            </div>
          </form>
          <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-white hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-bold py-2 px-4 rounded-lg border dark:border-gray-600 border-gray-300 transition-colors">Cancel</button>
            <button type="submit" onClick={handleSubmit} className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors">Save Product</button>
          </div>
        </div>
      </div>
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </>
  );
};

export default ProductFormModal;
