'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch {
      toast.error('Invalid email or password');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-semibold tracking-tight text-white">Alliance Car Rental</span>
        </div>
      </div>

      <Card className="backdrop-blur-sm bg-white/5 border-white/10 text-white shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-white">Sign in</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@alliancecarrental.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-red-500"
                {...register('email')}
              />
              {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-red-500"
                {...register('password')}
              />
              {errors.password && <p className="text-red-400 text-sm">{errors.password.message}</p>}
            </div>
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : 'Sign in'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Demo: admin@alliancecarrental.com / Admin@123
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
