import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../hooks/usePageTitle";

import { useAuth } from "../hooks/useAuth";
import { useRegisterOrganization } from "../hooks/useQueries";
import { useGetCallerUserProfile } from "../hooks/useQueries";

import Header from "../components/Header";
import Footer from "../components/Footer";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";

export default function RegisterOrganizationPage() {
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle('Organization Registration');
  
  const { user, register, loginStatus } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const registerOrg = useRegisterOrganization();

  // Redirect if already logged in
  useEffect(() => {
    if (!profileLoading && user && userProfile) {
      if (userProfile.userType === "organization") {
        navigate({ to: "/organization/dashboard" });
      } else if (userProfile.userType === "candidate") {
        navigate({ to: "/candidate/dashboard" });
      }
    }
  }, [user, userProfile, profileLoading, navigate]);

  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [established, setEstablished] = useState("");

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword || authPassword.length < 8) {
      toast.error("Enter a valid email and password (min 8 characters)");
      return;
    }
    try {
      const result = await register(authEmail.trim(), authPassword, "organization");
      
      // Check if email verification is required
      if (result?.requires_verification) {
        toast.success("Verification code sent to your email");
        navigate({ 
          to: "/verify-otp", 
          search: { email: result.email, purpose: "registration" } 
        });
        return;
      }
      
      toast.success("Account created. Now add your organization details.");
    } catch (err) {
      const msg = err?.body?.detail || err?.body?.email?.[0] || err?.message || "Registration failed";
      toast.error(msg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please create an account first");
      return;
    }

    try {
      await registerOrg.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        contactEmail: contactEmail.trim(),
        website: website.trim() || null,
        location: location.trim() || null,
        phone: phone.trim() || null,
        established: established ? parseInt(established, 10) : null,
      });

      toast.success("Organization registered successfully!");
      navigate({ to: "/organization/dashboard" });
    } catch (error) {
      const msg = error?.body?.detail || error?.message || "Registration failed";
      toast.error(msg);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-gray-900 dark:text-white">Register Your Organization</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Create an account with your email to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="authEmail" className="text-gray-900 dark:text-white">Email</Label>
                  <Input
                    id="authEmail"
                    type="email"
                    placeholder="org@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    disabled={loginStatus === "logging-in"}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authPassword" className="text-gray-900 dark:text-white">Password (min 8 characters)</Label>
                  <Input
                    id="authPassword"
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    minLength={8}
                    required
                    disabled={loginStatus === "logging-in"}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loginStatus === "logging-in"}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loginStatus === "logging-in" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account & continue"
                  )}
                </Button>
              </form>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate({ to: "/login" })}
                  className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Sign in
                </button>
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Organization Details</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Provide information about your organization
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-900 dark:text-white">Organization Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-900 dark:text-white">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-gray-900 dark:text-white">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  <Input
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  <Input
                    type="number"
                    placeholder="Established Year"
                    value={established}
                    onChange={(e) => setEstablished(e.target.value)}
                    className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={registerOrg.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {registerOrg.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    "Register Organization"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
