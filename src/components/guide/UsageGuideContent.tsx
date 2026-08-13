import { usageGuideSections } from "@/data/usageGuide";

export function UsageGuideContent() {
  return (
    <div className="space-y-8 text-xs leading-7 text-muted [&_h3]:font-medium [&_h3]:text-foreground">
      {usageGuideSections.map((section) => (
        <section key={section.id} id={section.id}>
          <h3 className="text-sm">{section.title}</h3>
          {section.paragraphs?.map((paragraph, index) => (
            <p key={`${section.id}-p-${index}`} className="mt-3 whitespace-pre-line">
              {paragraph}
            </p>
          ))}
          {section.listItems && (
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {section.listItems.map((item, index) => (
                <li key={`${section.id}-li-${index}`}>{item}</li>
              ))}
            </ul>
          )}
          {section.note && <p className="mt-3 whitespace-pre-line">※ {section.note}</p>}
        </section>
      ))}
    </div>
  );
}
