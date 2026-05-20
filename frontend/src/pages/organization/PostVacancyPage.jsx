import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { usePageTitle } from "../../hooks/usePageTitle";
import { fetchApi } from "@/lib/api";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function PostVacancy() {
  const navigate = useNavigate();
  
  // Set page title
  usePageTitle('Post a Job');
  
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
  const [generatedPasscode, setGeneratedPasscode] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",

    required_skills: "",
    education_required: "",
    job_title_aliases: "",
    keywords: "",

    min_experience_years: "",
    max_experience_years: "",
    location: "",
    salary_range: "",
    benefits: "",
    experience_level: "",

    is_public: true,
    allowed_candidates: 50,
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toArray = (value) =>
    value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

  const handleSubmit = async () => {
    try {
      const payload = {
        title: form.title,
        description: form.description,

        required_skills: toArray(form.required_skills),
        education_required: toArray(form.education_required),
        job_title_aliases: toArray(form.job_title_aliases),
        keywords: toArray(form.keywords),

        min_experience_years: Number(form.min_experience_years),
        max_experience_years: Number(form.max_experience_years),
        location: form.location,
        salary_range: form.salary_range,
        benefits: form.benefits,
        experience_level: form.experience_level,

        is_public: form.is_public,
        allowed_candidates: Number(form.allowed_candidates),
      };

      const response = await fetchApi("/vacancies/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Vacancy posted successfully");
      
      // If private vacancy, show passcode dialog
      if (!form.is_public && response.passcode) {
        setGeneratedPasscode(response.passcode);
        setShowPasscodeDialog(true);
      } else {
        navigate({ to: "/organization/dashboard" });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to post vacancy");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10">
        <Card className="max-w-xl mx-auto border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Post New Vacancy</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              placeholder="Job Title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />

            <Textarea
              placeholder="Job Description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />

            <Input
              placeholder="Required Skills (comma separated)"
              value={form.required_skills}
              onChange={(e) =>
                handleChange("required_skills", e.target.value)
              }
            />

            <Input
              placeholder="Education Required (comma separated)"
              value={form.education_required}
              onChange={(e) =>
                handleChange("education_required", e.target.value)
              }
            />

            <Input
              placeholder="Job Title Aliases (comma separated)"
              value={form.job_title_aliases}
              onChange={(e) =>
                handleChange("job_title_aliases", e.target.value)
              }
            />

            <Input
              placeholder="Keywords (comma separated)"
              value={form.keywords}
              onChange={(e) => handleChange("keywords", e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min Experience (years)"
                value={form.min_experience_years}
                onChange={(e) =>
                  handleChange("min_experience_years", e.target.value)
                }
              />
              <Input
                type="number"
                placeholder="Max Experience (years)"
                value={form.max_experience_years}
                onChange={(e) =>
                  handleChange("max_experience_years", e.target.value)
                }
              />
            </div>

            <Input
              placeholder="Location"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />

            <Input
              placeholder="Salary Range"
              value={form.salary_range}
              onChange={(e) => handleChange("salary_range", e.target.value)}
            />

            <Textarea
              placeholder="Benefits"
              value={form.benefits}
              onChange={(e) => handleChange("benefits", e.target.value)}
            />

            <Input
              placeholder="Experience Level (e.g. beginner / mid / senior)"
              value={form.experience_level}
              onChange={(e) =>
                handleChange("experience_level", e.target.value)
              }
            />

            {/* is_public toggle */}
            <div className="flex items-center justify-between pt-2">
              <Label className="text-gray-900 dark:text-white">Public Listing</Label>
              <Switch
                checked={form.is_public}
                onCheckedChange={(v) => handleChange("is_public", v)}
              />
            </div>

            <Input
              type="number"
              placeholder="Allowed Candidates"
              value={form.allowed_candidates}
              onChange={(e) =>
                handleChange("allowed_candidates", e.target.value)
              }
            />

            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit}>
              Post Vacancy
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Passcode Dialog for Private Vacancies */}
      <Dialog open={showPasscodeDialog} onOpenChange={setShowPasscodeDialog}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Private Vacancy Created!</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Your vacancy has been posted as private. Share this passcode with candidates you want to apply.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Passcode</p>
              <p className="text-3xl font-bold tracking-wider text-gray-900 dark:text-white">{generatedPasscode}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPasscode);
                  toast.success("Passcode copied to clipboard");
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Passcode
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setShowPasscodeDialog(false);
                  navigate({ to: "/organization/dashboard" });
                }}
              >
                <Check className="mr-2 h-4 w-4" />
                Done
              </Button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              You can view this passcode anytime in the vacancy details page.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
