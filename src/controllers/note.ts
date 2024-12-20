import { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "../lib/prisma-client.js";
import { UnauthorizedError } from "../errors/unauthorized.js";
import { BadRequestError } from "../errors/bad-request.js";

const createNote: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      title,
      content,
      name,
      tags,
    }: {
      title: string;
      content: string;
      name: string;
      tags: Array<{ name: string }> | undefined;
    } = req.body;
    const userId = req?.user?.id;

    if (!userId) return next(new UnauthorizedError("User not authorized"));

    if (!title || !content)
      return next(new BadRequestError("Title and content are required"));

    const note = await prisma.$transaction(async (prisma) => {
      const category = name
        ? await prisma.category.upsert({
            where: {
              name_user_id: {
                name: name as string,
                user_id: userId,
              },
            },
            update: {},
            create: { name, user_id: userId },
          })
        : null;

      const createdNote = await prisma.note.create({
        data: {
          title,
          content,
          user_id: userId,
          category_id: category?.id,
        },
      });

      if (tags && Array.isArray(tags)) {
        const uniqueTags = tags.map((tag) => ({
          name: tag.name,
          user_id: userId,
        }));

        await prisma.tag.createMany({ data: uniqueTags, skipDuplicates: true });

        const tagRecords = await prisma.tag.findMany({
          where: { name: { in: tags.map((tag) => tag.name) }, user_id: userId },
        });

        await prisma.noteTag.createMany({
          data: tagRecords.map((tag) => {
            return { note_id: createdNote.id, tag_id: tag?.id };
          }),
        });
      }

      return createdNote;
    });

    const jsonBody = {
      error: false,
      message: "Note create!",
      note,
    };

    res.status(201).json(jsonBody);
  } catch (error) {
    next(error);
  }
};

export { createNote };
