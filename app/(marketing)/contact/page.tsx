import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <Card className="max-w-md border-[#E8F5E9]">
      <CardHeader>
        <CardTitle>Contact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-[#1B5E20]">Phone:</span>{" "}
          <a href="tel:+918433250993" className="hover:underline">
            +91 8433250993
          </a>
        </p>
        <p>
          <span className="font-medium text-[#1B5E20]">Email:</span>{" "}
          <a
            href="mailto:Greenwellindia25@gmail.com"
            className="hover:underline"
          >
            Greenwellindia25@gmail.com
          </a>
        </p>
        <p className="pt-2 text-xs">
          Same contact style as{" "}
          <a
            href="https://greenwellindia.in/Default.aspx"
            className="text-[#2E7D32] underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            greenwellindia.in
          </a>
          .
        </p>
      </CardContent>
    </Card>
    </div>
  );
}
