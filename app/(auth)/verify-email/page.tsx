import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MailCheck } from "lucide-react";

export default function VerifyEmail() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-[991px] md:min-w-[500px]">
        <CardHeader className="space-y-1 text-center">
          <MailCheck className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We've sent a verification link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-center">
          <p className="text-muted-foreground">
            Please click the link in the email to verify your account and
            complete your registration.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Link href="/login" className="w-full">
            <Button className="w-full bg-primary hover:bg-primary/90">
              Return to login
            </Button>
          </Link>
          <p className="text-sm text-center text-muted-foreground">
            Need help?{" "}
            <Link href="/" className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
