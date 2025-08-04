import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Check } from '@phosphor-icons/react';

interface ColorTheme {
  id: string;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'default',
    name: 'Professional',
    description: 'Clean and modern design with vibrant accents',
    preview: {
      primary: '#6366f1',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#fefefe'
    }
  },
  {
    id: 'colorful',
    name: 'Vibrant',
    description: 'Bold and energetic with strong color presence',
    preview: {
      primary: '#8b5cf6',
      secondary: '#06d6a0',
      accent: '#ff6b6b',
      background: '#fefefe'
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Subtle and refined with muted tones',
    preview: {
      primary: '#374151',
      secondary: '#9ca3af',
      accent: '#6b7280',
      background: '#fefefe'
    }
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    description: 'Calming blues and teals for a serene experience',
    preview: {
      primary: '#0ea5e9',
      secondary: '#14b8a6',
      accent: '#06b6d4',
      background: '#fefefe'
    }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm oranges and reds for an energetic feel',
    preview: {
      primary: '#ea580c',
      secondary: '#dc2626',
      accent: '#f97316',
      background: '#fefefe'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural greens for a growth-focused mindset',
    preview: {
      primary: '#059669',
      secondary: '#16a34a',
      accent: '#65a30d',
      background: '#fefefe'
    }
  }
];

interface ColorThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export function ColorThemeSelector({ currentTheme, onThemeChange }: ColorThemeSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    onThemeChange(themeId);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', themeId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Color Theme</CardTitle>
        </div>
        <CardDescription>
          Choose a color theme that reflects your personality and enhances your financial tracking experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COLOR_THEMES.map((theme) => (
            <div
              key={theme.id}
              className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedTheme === theme.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleThemeSelect(theme.id)}
            >
              {selectedTheme === theme.id && (
                <div className="absolute top-2 right-2">
                  <Badge variant="default" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </Badge>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: theme.preview.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: theme.preview.secondary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: theme.preview.accent }}
                  />
                </div>
                
                <div>
                  <h4 className="font-medium text-sm">{theme.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {theme.description}
                  </p>
                </div>
                
                <div className="bg-muted/30 rounded-md p-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="h-2 bg-current rounded opacity-80" style={{ backgroundColor: theme.preview.primary, width: '60%' }} />
                      <div className="text-xs font-medium">$1,234</div>
                    </div>
                    <div className="flex gap-1">
                      <div className="h-1 bg-current rounded flex-1" style={{ backgroundColor: theme.preview.secondary }} />
                      <div className="h-1 bg-current rounded flex-1" style={{ backgroundColor: theme.preview.accent }} />
                      <div className="h-1 bg-current rounded flex-1 opacity-30" style={{ backgroundColor: theme.preview.primary }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {selectedTheme !== currentTheme && (
          <div className="mt-6 flex justify-end">
            <Button onClick={() => handleThemeSelect(selectedTheme)}>
              Apply Theme
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}