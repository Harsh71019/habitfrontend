import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Palette } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { api, type Category } from '@/lib/api';

interface CategoryManagerProps {
  onCategorySelect?: (category: Category) => void;
  selectedCategoryId?: string;
  showTitle?: boolean;
}

export function CategoryManager({ 
  onCategorySelect, 
  selectedCategoryId, 
  showTitle = true 
}: CategoryManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const queryClient = useQueryClient();

  const { data: categoriesResponse, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories({ limit: 50 }),
  });

  const categories = categoriesResponse?.data || [];

  const createCategoryMutation = useMutation({
    mutationFn: (categoryData: { name: string; color: string; icon: string }) =>
      api.createCategory(categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowCreateDialog(false);
      setNewCategoryName('');
      setSelectedColor('#3B82F6');
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; color: string; icon: string }) =>
      api.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowEditDialog(false);
      setEditingCategory(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    
    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      color: selectedColor,
      icon: 'tag'
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setSelectedColor(category.color);
    setShowEditDialog(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategoryName.trim()) return;
    
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      name: newCategoryName.trim(),
      color: selectedColor,
      icon: 'tag'
    });
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  if (isLoading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Categories</span>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              No categories yet. Create your first category!
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`group relative flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                  selectedCategoryId === category.id
                    ? 'bg-accent ring-2 ring-primary'
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => onCategorySelect?.(category)}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: category.color }}
                />
                <Badge variant="outline" className="text-xs">
                  {category.name}
                </Badge>
                <div className="hidden group-hover:flex items-center gap-1 ml-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCategory(category);
                    }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            {!showTitle && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateDialog(true)}
                className="h-8"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Create Category Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category to organize your habits and tasks.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category Name</label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border-2 border-gray-200 cursor-pointer flex items-center justify-center"
                      style={{ backgroundColor: selectedColor }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    >
                      <Palette className="w-4 h-4 text-white mix-blend-difference" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {selectedColor}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded border-2 ${
                          selectedColor === color ? 'border-gray-400' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                  
                  {showColorPicker && (
                    <div className="mt-2">
                      <HexColorPicker color={selectedColor} onChange={setSelectedColor} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update the category name and color.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category Name</label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border-2 border-gray-200 cursor-pointer flex items-center justify-center"
                      style={{ backgroundColor: selectedColor }}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    >
                      <Palette className="w-4 h-4 text-white mix-blend-difference" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {selectedColor}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded border-2 ${
                          selectedColor === color ? 'border-gray-400' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      />
                    ))}
                  </div>
                  
                  {showColorPicker && (
                    <div className="mt-2">
                      <HexColorPicker color={selectedColor} onChange={setSelectedColor} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateCategory}
                disabled={!newCategoryName.trim() || updateCategoryMutation.isPending}
              >
                {updateCategoryMutation.isPending ? 'Updating...' : 'Update Category'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}