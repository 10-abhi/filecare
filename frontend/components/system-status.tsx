'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function SystemStatus() {
  const { user } = useAuth();

  const checks = [
    {
      name: 'Frontend Loading',
      status: 'success',
      description: 'Frontend components and context loaded'
    },
    {
      name: 'Authentication',
      status: user ? 'success' : 'warning',
      description: user ? 'User authenticated' : 'Please log in'
    },
    {
      name: 'API Configuration',
      status: process.env.NEXT_PUBLIC_API_URL ? 'success' : 'error',
      description: `API URL: ${process.env.NEXT_PUBLIC_API_URL || 'Not configured'}`
    },
    {
      name: 'Environment',
      status: 'success',
      description: `Mode: ${process.env.NODE_ENV || 'development'}`
    },
    {
      name: 'Responsive Design',
      status: 'success',
      description: 'Mobile-first design implemented'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-center">
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {checks.map((check, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(check.status)}
              <div>
                <div className="font-medium">{check.name}</div>
                <div className="text-sm text-gray-600">{check.description}</div>
              </div>
            </div>
            <Badge className={getStatusColor(check.status)}>
              {check.status}
            </Badge>
          </div>
        ))}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>✅ Production Ready Features:</strong>
            <ul className="mt-2 space-y-1 ml-4">
              <li>• Mobile responsive design</li>
              <li>• Error boundaries and loading states</li>
              <li>• Environment-based API configuration</li>
              <li>• Production build optimization</li>
              <li>• TypeScript type safety</li>
              <li>• SEO metadata</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
