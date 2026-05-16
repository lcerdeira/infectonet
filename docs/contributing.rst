Contributing
============

We welcome contributions to InfectoNET — bug reports, new pathogen data,
UI improvements, and documentation updates are all appreciated.

Getting the Code
----------------

.. code-block:: bash

   $ git clone https://github.com/lcerdeira/infectonet.git
   $ cd infectonet
   $ npm install
   $ cp .env.local.example .env.local   # set MONGODB_URI
   $ npm run dev

The development server starts at ``http://localhost:3000``.

Reporting Issues
----------------

Open an issue on GitHub:
https://github.com/lcerdeira/infectonet/issues

Please include:

* The pathogen ID affected (if applicable)
* Steps to reproduce
* Expected vs actual behaviour
* Browser / OS if it is a UI issue

Adding a New Pathogen
----------------------

1. Add an entry to ``src/lib/viruses.ts`` with a unique ``id``, display
   ``label``, ``family``, ``genome``, and ``group``.

2. Create a MongoDB database named ``<id>`` with a ``genomes`` collection
   (the import scripts do this automatically on first upsert).

3. If the pathogen has a virus-specific insight field (e.g. a custom
   ``myfield_susceptibility``), add it to the ``PROJECTION`` object in
   ``src/app/api/viruses/[id]/route.ts`` and the ``COALESCE_GENOTYPE``
   pipeline in ``src/app/api/viruses/[id]/countries/route.ts``.

4. Add outbreak monitoring keywords to the ``VIRUS_KEYWORDS`` map in
   ``src/app/api/outbreak/[virus]/route.ts``.

5. Document the new pathogen in ``docs/pathogens.rst``.

Contact
-------

For questions, data requests, or collaboration enquiries:
`infectonet@gmail.com <mailto:infectonet@gmail.com>`_

Source code: https://github.com/lcerdeira/infectonet
