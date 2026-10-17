import CampusDocumentBoundary from "@/components/campus/CampusDocumentBoundary";

export default function CampusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CampusDocumentBoundary>{children}</CampusDocumentBoundary>;
}
