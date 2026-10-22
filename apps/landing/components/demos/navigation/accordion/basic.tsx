'use client';

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from '@innostes/ui';

const faqs = [
  {
    q: 'How do I export orders?',
    a: 'Select orders in the table and choose Export. You can export up to 10,000 rows as CSV or Excel.',
  },
  {
    q: 'Can I change my billing period?',
    a: 'Yes. Go to Settings → Billing. Changes apply from the next invoice.',
  },
  {
    q: 'Who can issue refunds?',
    a: 'Owners and admins, plus members with the “Issue refunds” permission.',
  },
];

export default function AccordionDemo() {
  return (
    <Accordion defaultValue={['0']} className="w-full max-w-lg">
      {faqs.map((item, i) => (
        <AccordionItem key={item.q} value={String(i)}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionPanel className="text-muted-foreground">
            {item.a}
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
