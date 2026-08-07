const FIXED_PROVIDER = {
  legalName: '9 Jobs Pty Ltd',
  abn: '83679842972',
  phone: '+61 422 279 428',
};

function createSection(heading, paragraphs, intro = '') {
  return {
    heading,
    intro,
    paragraphs,
  };
}

export function buildFortnightAgreementTemplate(input) {
  const provider = {
    legalName: input.providerName || FIXED_PROVIDER.legalName,
    abn: input.providerAbn || FIXED_PROVIDER.abn,
    phone: input.providerPhone || FIXED_PROVIDER.phone,
  };

  const sections = [
    createSection(
      '1. Service Provider',
      [
        'Resume Optimisation: Enhancing the client\'s resume to improve its appeal to potential employers.',
        'Profile Optimisation: Refining the client\'s online profiles on platforms like LinkedIn to ensure maximum visibility.',
        'Job Searching: Identifying suitable job opportunities that align with the client\'s skills and career goals.',
        'Application Submission: Submitting job applications on relevant employment portals such as SEEK, LinkedIn, and other platforms.',
      ],
      '9Jobs Application Services will offer job application support services, which include:'
    ),
    createSection(
      '2. Service Period',
      [],
      `The service period is defined as ${(() => {
        const term = (input.initialTerm || 'two (2)').trim();
        return term.toLowerCase().includes('month') ? term : `${term} months`;
      })()}, commencing from the date this agreement is signed.`
    ),
    createSection(
      '3. Upfront Service Fee',
      [
        `Fee Amount: The Client agrees to pay an upfront service fee of ${input.servicePrice || 'AUD $200'}.`,
        'Non-Refundable: This fee is non-refundable.',
        'Coverage: It covers profile review, resume optimisation, account setup, and initial job application activities.',
      ]
    ),
    createSection(
      '4. Success Fee',
      [
        'If the Client secures employment during the service period, or from any application submitted by 9Jobs during the service period, the Client agrees to pay a success fee.',
        'Amount: The success fee is equal to fortnight gross salary before taxes.',
      ]
    ),
    createSection(
      '5. Payment Terms',
      [
        'The success fee shall be paid within seven (7) days of the Client accepting the employment offer.',
      ]
    ),
    createSection(
      '6. Confidentiality',
      [
        'All personal information, documents, and account access provided by the Client will be kept confidential and used solely for job application purposes.',
      ]
    ),
    createSection(
      '7. Client Responsibilities',
      [
        'Provide accurate information.',
        'Respond to communications in a timely manner.',
        'Attend scheduled interviews whenever possible.',
      ],
      'The Client agrees to:'
    ),
    createSection(
      '8. No Guarantee',
      [
        'Employment',
        'Interview invitations',
        'Sponsorship outcomes',
        'Visa outcomes',
        'Specific salary levels',
      ],
      '9Jobs does not guarantee:'
    ),
    createSection(
      '9. Acknowledgement',
      [],
      'By signing this agreement, both parties confirm their understanding and acceptance of the terms outlined above.'
    ),
  ];

  const notes = input.notes ? String(input.notes).trim() : '';
  if (notes) {
    sections.push(
      createSection('Notes', [
        notes,
      ])
    );
  }

  return {
    title: '9Jobs Service Agreement',
    provider,
    agreementDate: input.agreementDate,
    sections,
    signatureBlocks: {
      provider: {
        label: 'Service Provider',
        name: input.providerSignatureName || 'Aditya Singh',
        email: input.providerEmail || FIXED_PROVIDER.phone,
        phone: provider.phone,
      },
      customer: {
        label: 'Customer',
        name: input.clientName,
        email: input.clientEmail,
        phone: input.clientPhone,
      },
    },
  };
}
