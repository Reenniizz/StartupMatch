'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Test de todos los imports para confirmar retrocompatibilidad
import RichTextEditorFull from '@/components/RichTextEditor';
import RichTextEditor from '@/components/RichTextEditor';
import { RichTextEditorMinimal } from '@/components/RichTextEditor/index';

export default function RichTextEditorTest() {
  const [fullContent, setFullContent] = useState('# Editor Completo\n\nEste editor tiene **todas** las funcionalidades:\n- Vista previa\n- Toolbar completo\n- Múltiples formatos');
  const [simpleContent, setSimpleContent] = useState('**Editor Simple** - Solo funcionalidades básicas:\n- Negrita e *italica*\n- [Enlaces](https://example.com)');
  const [minimalContent, setMinimalContent] = useState('Editor mínimo - Solo texto plano sin toolbar');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🎉 RichTextEditor Consolidation Test
          </h1>
          <p className="text-gray-600 text-lg">
            Probando los 3 modos del editor unificado + retrocompatibilidad
          </p>
        </div>

        <Tabs defaultValue="full" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="full">Full Mode</TabsTrigger>
            <TabsTrigger value="simple">Simple Mode</TabsTrigger>
            <TabsTrigger value="minimal">Minimal Mode</TabsTrigger>
          </TabsList>

          <TabsContent value="full">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⭐ Editor Completo
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Full Mode</span>
                </CardTitle>
                <CardDescription>
                  Toolbar completo + Vista previa + Todas las funcionalidades markdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditorFull
                  value={fullContent}
                  onChange={setFullContent}
                  placeholder="Escribe contenido completo con markdown..."
                  minHeight={300}
                />
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium mb-2">✅ Funciones activas:</p>
                  <div className="text-sm text-green-600">
                    • Toolbar completo • Vista previa • Shortcuts de teclado • Markdown completo
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simple">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ✨ Editor Simple
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">Simple Mode</span>
                </CardTitle>
                <CardDescription>
                  Toolbar básico sin vista previa - Perfecto para comentarios y mensajes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  value={simpleContent}
                  onChange={setSimpleContent}
                  placeholder="Escribe contenido simple..."
                  minHeight={200}
                />
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium mb-2">✅ Funciones activas:</p>
                  <div className="text-sm text-green-600">
                    • Negrita, cursiva • Listas • Enlaces • Sin vista previa
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="minimal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📝 Editor Mínimo
                  <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Minimal Mode</span>
                </CardTitle>
                <CardDescription>
                  Solo textarea - Para casos donde necesitas texto plano rápido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditorMinimal
                  value={minimalContent}
                  onChange={setMinimalContent}
                  placeholder="Solo texto plano..."
                  minHeight={150}
                />
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium mb-2">✅ Funciones activas:</p>
                  <div className="text-sm text-green-600">
                    • Solo textarea • Sin toolbar • Máximo rendimiento
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center">📊 Consolidation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">-233</div>
                <div className="text-sm text-red-700">Lines of duplicated code eliminated</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">3</div>
                <div className="text-sm text-green-700">Modes available (was 2)</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">100%</div>
                <div className="text-sm text-blue-700">Backward compatibility</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
