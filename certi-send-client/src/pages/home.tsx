import { Link } from 'react-router-dom';
import { Award, CheckCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth';

export function Home() {
  const { user } = useAuth();

  return (
    <div className="relative isolate">
      {/* Background gradient */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-pink-500">
              Create and Verify Certificates with Confidence
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Generate beautiful certificates for your events, manage participants, and ensure certificate authenticity with blockchain-powered verification.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {user ? (
                <Link to="/create-event">
                  <Button size="lg">
                    Create Event
                    <Upload className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Link to="/login?redirect=/create-event">
                  <Button size="lg">
                    Get Started
                    <Upload className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link to="/verify">
                <Button variant="outline" size="lg">
                  Claim Certificate
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-20">
            <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-lg bg-zinc-900 p-4 mb-4">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Event</h3>
                <p className="text-zinc-400">Upload participant details and certificate design for your event</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-lg bg-zinc-900 p-4 mb-4">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Generate Certificates</h3>
                <p className="text-zinc-400">Automatically generate personalized certificates with secure QR codes</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="rounded-lg bg-zinc-900 p-4 mb-4">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Verify Authenticity</h3>
                <p className="text-zinc-400">Instantly verify certificate authenticity using our secure verification system</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}