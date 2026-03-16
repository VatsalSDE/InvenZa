import React from "react";
import { Upload, Camera, Image as ImageIcon } from "lucide-react";

export default function ProductForm({
  formData,
  formErrors,
  imageFile,
  imagePreview,
  uploading,
  onInputChange,
  onImageChange,
  onImageUpload,
  onCancel,
  onSubmit,
  submitLabel = "Submit",
}) {
  return (
    <form onSubmit={onSubmit} className="p-8 space-y-6">
      {/* Product Name */}
      <div>
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="product_name"
          value={formData.product_name}
          onChange={onInputChange}
          className={`w-full px-4 py-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg ${
            formErrors.product_name ? 'border-red-300' : 'border-gray-200'
          }`}
          placeholder="Enter product name"
        />
        {formErrors.product_name && (
          <p className="text-red-500 text-sm mt-1">{formErrors.product_name}</p>
        )}
      </div>

      {/* Category and Burners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={onInputChange}
            className={`w-full px-4 py-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg ${
              formErrors.category ? 'border-red-300' : 'border-gray-200'
            }`}
          >
            <option value="glass">Glass</option>
            <option value="steel">Steel</option>
          </select>
          {formErrors.category && (
            <p className="text-red-500 text-sm mt-1">{formErrors.category}</p>
          )}
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Number of Burners <span className="text-red-500">*</span>
          </label>
          <select
            name="no_burners"
            value={formData.no_burners}
            onChange={onInputChange}
            className={`w-full px-4 py-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg ${
              formErrors.no_burners ? 'border-red-300' : 'border-gray-200'
            }`}
          >
            <option value="1">1 Burner</option>
            <option value="2">2 Burners</option>
            <option value="3">3 Burners</option>
            <option value="4">4 Burners</option>
            <option value="5">5 Burners</option>
          </select>
          {formErrors.no_burners && (
            <p className="text-red-500 text-sm mt-1">{formErrors.no_burners}</p>
          )}
        </div>
      </div>

      {/* Burner Type and Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Burner Type <span className="text-red-500">*</span>
          </label>
          <select
            name="type_burner"
            value={formData.type_burner}
            onChange={onInputChange}
            className={`w-full px-4 py-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg ${
              formErrors.type_burner ? 'border-red-300' : 'border-gray-200'
            }`}
          >
            <option value="Brass">Brass</option>
            <option value="Steel">Steel</option>
            <option value="Aluminum">Aluminum</option>
            <option value="Copper">Copper</option>
          </select>
          {formErrors.type_burner && (
            <p className="text-red-500 text-sm mt-1">{formErrors.type_burner}</p>
          )}
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Price (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={onInputChange}
            className={`w-full px-4 py-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg ${
              formErrors.price ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="0.00"
            step="0.01"
            min="0"
          />
          {formErrors.price && (
            <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
          )}
        </div>
      </div>

      {/* Quantity and Min Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={onInputChange}
            className={`w-full px-4 py-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg ${
              formErrors.quantity ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="0"
            min="0"
          />
          {formErrors.quantity && (
            <p className="text-red-500 text-sm mt-1">{formErrors.quantity}</p>
          )}
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Min Stock Level
          </label>
          <input
            type="number"
            name="min_stock_level"
            value={formData.min_stock_level}
            onChange={onInputChange}
            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-lg"
            placeholder="10"
            min="0"
          />
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          Product Image
        </label>
        <div className="space-y-4">
          {/* Image Preview */}
          {(imagePreview || formData.image_url) && (
            <div className="relative w-32 h-32 border-2 border-gray-200 rounded-2xl overflow-hidden">
              <img
                src={imagePreview || formData.image_url}
                alt="Product preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Upload Controls */}
          <div className="flex gap-4">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-gray-600 font-medium">Choose Image</span>
              </div>
            </label>

            {imageFile && (
              <button
                type="button"
                onClick={onImageUpload}
                disabled={uploading}
                className="px-6 py-4 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Upload
                  </>
                )}
              </button>
            )}
          </div>

          {/* Image URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or enter image URL
            </label>
            <input
              type="url"
              name="image_url"
              value={formData.image_url}
              onChange={onInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-4 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors text-lg font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-600 transition-colors shadow-lg text-lg font-semibold"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
