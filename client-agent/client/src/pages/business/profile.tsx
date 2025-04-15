import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBusinessSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const formSchema = insertBusinessSchema.extend({
  services: z.string().transform((val) => val.split(",").map((s) => s.trim()).filter(Boolean)),
});

type FormValues = z.infer<typeof formSchema>;

export default function BusinessProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      category: "",
      location: "",
      services: [],
    },
  });

  const createProfile = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest("POST", "/api/businesses", {
        ...data,
        userId: 1, // In a real app, this would come from auth context
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile created",
        description: "Your business profile has been created successfully!",
      });
      setLocation("/messages");
    },
  });

  return (
    <div className="container max-w-lg mx-auto px-4">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Create Business Profile</CardTitle>
          <CardDescription>
            Tell us about your business to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => createProfile.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Category</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="services"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Services (comma-separated)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={createProfile.isPending}
              >
                Create Profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}