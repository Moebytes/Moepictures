CREATE TABLE IF NOT EXISTS "tag map tags" (
    "postID" bigint PRIMARY KEY REFERENCES posts ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "tags" text[]
);

CREATE OR REPLACE FUNCTION tag_map_tags_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM "tag map tags" WHERE "postID" = NEW."postID") THEN
        UPDATE "tag map tags"
        SET "tags" = (SELECT array_agg(DISTINCT "tag") FROM "tag map" WHERE "postID" = NEW."postID")
        WHERE "postID" = NEW."postID";
    ELSE
        INSERT INTO "tag map tags"("postID", "tags")
        VALUES (NEW."postID", (SELECT array_agg(DISTINCT "tag") FROM "tag map" WHERE "postID" = NEW."postID"));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tag_map_tags_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "tag map" WHERE "postID" = OLD."postID") THEN
        DELETE FROM "tag map tags" WHERE "postID" = OLD."postID";
    ELSE
        UPDATE "tag map tags"
        SET "tags" = (SELECT array_agg(DISTINCT "tag") FROM "tag map" WHERE "postID" = OLD."postID")
        WHERE "postID" = OLD."postID";
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tag_map_tags_update_trigger ON "tag map";
CREATE TRIGGER tag_map_tags_update_trigger
AFTER INSERT OR UPDATE ON "tag map"
FOR EACH ROW EXECUTE FUNCTION tag_map_tags_insert();

DROP TRIGGER IF EXISTS tag_map_tags_delete_trigger ON "tag map";
CREATE TRIGGER tag_map_tags_delete_trigger
AFTER DELETE ON "tag map"
FOR EACH ROW EXECUTE FUNCTION tag_map_tags_delete();

CREATE TABLE IF NOT EXISTS "tag map posts" (
    "tag" text PRIMARY KEY REFERENCES tags ("tag") ON UPDATE CASCADE ON DELETE CASCADE,
    "posts" bigint[]
);

CREATE OR REPLACE FUNCTION tag_map_posts_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM "tag map posts" WHERE "tag" = NEW."tag") THEN
        UPDATE "tag map posts"
        SET "posts" = (SELECT array_agg(DISTINCT "postID") FROM "tag map" WHERE "tag" = NEW."tag")
        WHERE "tag" = NEW."tag";
    ELSE
        INSERT INTO "tag map posts"("tag", "posts")
        VALUES (NEW."tag", (SELECT array_agg(DISTINCT "postID") FROM "tag map" WHERE "tag" = NEW."tag"));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tag_map_posts_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "tag map" WHERE "tag" = OLD."tag") THEN
        DELETE FROM "tag map posts" WHERE "tag" = OLD."tag";
    ELSE
        UPDATE "tag map posts"
        SET "posts" = (SELECT array_agg(DISTINCT "postID") FROM "tag map" WHERE "tag" = OLD."tag")
        WHERE "tag" = OLD."tag";
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tag_map_posts_update_trigger ON "tag map";
CREATE TRIGGER tag_map_posts_update_trigger
AFTER INSERT OR UPDATE ON "tag map"
FOR EACH ROW EXECUTE FUNCTION tag_map_posts_insert();

DROP TRIGGER IF EXISTS tag_map_posts_delete_trigger ON "tag map";
CREATE TRIGGER tag_map_posts_delete_trigger
AFTER DELETE ON "tag map"
FOR EACH ROW EXECUTE FUNCTION tag_map_posts_delete();

CREATE TABLE IF NOT EXISTS "tag group tags" (
    "groupID" bigint PRIMARY KEY REFERENCES "tag groups" ("groupID") ON UPDATE CASCADE ON DELETE CASCADE,
    "postID" bigint REFERENCES "posts" ("postID") ON UPDATE CASCADE ON DELETE CASCADE,
    "name" text,
    "tags" text[],
    UNIQUE ("postID", "name")
);

CREATE OR REPLACE FUNCTION tag_group_tags_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM "tag group tags" WHERE "groupID" = NEW."groupID") THEN
        UPDATE "tag group tags"
        SET "tags" = ARRAY(
            SELECT DISTINCT "tag map"."tag"
            FROM "tag group map"
            JOIN "tag map" ON "tag map"."mapID" = "tag group map"."tagMapID"
            WHERE "tag group map"."groupID" = NEW."groupID"
        ),
        "postID" = (SELECT "postID" FROM "tag groups" WHERE "tag groups"."groupID" = NEW."groupID" LIMIT 1),
        "name" = (SELECT "name" FROM "tag groups" WHERE "tag groups"."groupID" = NEW."groupID" LIMIT 1)
        WHERE "groupID" = NEW."groupID";
    ELSE
        INSERT INTO "tag group tags" ("groupID", "postID", "name", "tags")
        VALUES (NEW."groupID", 
        (SELECT "postID" FROM "tag groups" WHERE "tag groups"."groupID" = NEW."groupID" LIMIT 1),
        (SELECT "name" FROM "tag groups" WHERE "tag groups"."groupID" = NEW."groupID" LIMIT 1),
        ARRAY(
            SELECT DISTINCT "tag map"."tag"
            FROM "tag group map"
            JOIN "tag map" ON "tag map"."mapID" = "tag group map"."tagMapID"
            WHERE "tag group map"."groupID" = NEW."groupID"
        ));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tag_group_tags_delete()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "tag group tags" WHERE "groupID" = OLD."groupID") THEN
        DELETE FROM "tag group tags" WHERE "groupID" = OLD."groupID";
    ELSE
        UPDATE "tag group tags"
        SET "tags" = ARRAY(
            SELECT DISTINCT "tag map"."tag"
            FROM "tag group map"
            JOIN "tag map" ON "tag map"."mapID" = "tag group map"."tagMapID"
            WHERE "tag group map"."groupID" = OLD."groupID"
        ),
        "postID" = (SELECT "postID" FROM "tag groups" WHERE "tag groups"."groupID" = OLD."groupID" LIMIT 1),
        "name" = (SELECT "name" FROM "tag groups" WHERE "tag groups"."groupID" = OLD."groupID" LIMIT 1)
        WHERE "groupID" = OLD."groupID";
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tag_group_tags_update_trigger ON "tag group map";
CREATE TRIGGER tag_group_tags_update_trigger
AFTER INSERT OR UPDATE ON "tag group map"
FOR EACH ROW EXECUTE FUNCTION tag_group_tags_insert();

DROP TRIGGER IF EXISTS tag_group_tags_delete_trigger ON "tag group map";
CREATE TRIGGER tag_group_tags_delete_trigger
AFTER DELETE ON "tag group map"
FOR EACH ROW EXECUTE FUNCTION tag_group_tags_delete();

CREATE OR REPLACE FUNCTION update_tag_keys()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "post history"
  SET "artists" = array_replace("artists", OLD.tag, NEW.tag)
  WHERE "artists" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "characters" = array_replace("characters", OLD.tag, NEW.tag)
  WHERE "characters" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "series" = array_replace("series", OLD.tag, NEW.tag)
  WHERE "series" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "tags" = array_replace("tags", OLD.tag, NEW.tag)
  WHERE "tags" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "addedTags" = array_replace("addedTags", OLD.tag, NEW.tag)
  WHERE "addedTags" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "removedTags" = array_replace("removedTags", OLD.tag, NEW.tag)
  WHERE "removedTags" @> ARRAY[OLD.tag];
  
  UPDATE "tag edit requests"
  SET "implications" = array_replace("implications", OLD.tag, NEW.tag)
  WHERE "implications" @> ARRAY[OLD.tag];
  
  UPDATE "tag history"
  SET "implications" = array_replace("implications", OLD.tag, NEW.tag)
  WHERE "implications" @> ARRAY[OLD.tag];

  UPDATE "note history"
  SET "notes" = (
    SELECT jsonb_agg(
      CASE WHEN note->>'characterTag' = OLD.tag THEN
          jsonb_set(note, '{characterTag}', to_jsonb(NEW.tag))
      ELSE note END
    )
    FROM jsonb_array_elements("notes") AS note
  )
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements("notes") AS note
    WHERE note->>'characterTag' = OLD.tag
  );

  UPDATE "post history"
  SET "tagGroups" = (
    SELECT jsonb_agg(jsonb_set(tag_group::jsonb, '{tags}', 
        (SELECT jsonb_agg(CASE WHEN tag = OLD.tag THEN NEW.tag ELSE tag END)
         FROM jsonb_array_elements_text(tag_group->'tags') AS tag)
      ))
    FROM jsonb_array_elements("tagGroups") AS tag_group
  )
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements("tagGroups") AS tag_group
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(tag_group->'tags') AS tag
      WHERE tag = OLD.tag
  ));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_tag_keys()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "post history"
  SET "artists" = array_remove("artists", OLD.tag)
  WHERE "artists" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "characters" = array_remove("characters", OLD.tag)
  WHERE "characters" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "series" = array_remove("series", OLD.tag)
  WHERE "series" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "tags" = array_remove("tags", OLD.tag)
  WHERE "tags" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "addedTags" = array_remove("addedTags", OLD.tag)
  WHERE "addedTags" @> ARRAY[OLD.tag];
  
  UPDATE "post history"
  SET "removedTags" = array_remove("removedTags", OLD.tag)
  WHERE "removedTags" @> ARRAY[OLD.tag];
  
  UPDATE "tag edit requests"
  SET "implications" = array_remove("implications", OLD.tag)
  WHERE "implications" @> ARRAY[OLD.tag];
  
  UPDATE "tag history"
  SET "implications" = array_remove("implications", OLD.tag)
  WHERE "implications" @> ARRAY[OLD.tag];

  UPDATE "note history"
  SET "notes" = (
    SELECT jsonb_agg(
      CASE WHEN note->>'characterTag' = OLD.tag THEN
          jsonb_set(note, '{characterTag}', 'null'::jsonb)
      ELSE note END
    )
    FROM jsonb_array_elements("notes") AS note
  )
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements("notes") AS note
    WHERE note->>'characterTag' = OLD.tag
  );

  UPDATE "post history"
  SET "tagGroups" = (
    SELECT jsonb_agg(jsonb_set(tag_group::jsonb, '{tags}', 
        (SELECT jsonb_agg(tag)
        FROM jsonb_array_elements_text(tag_group->'tags') AS tag
        WHERE tag != OLD.tag)
    ))
    FROM jsonb_array_elements("tagGroups") AS tag_group
  )
  WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements("tagGroups") AS tag_group
    WHERE EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(tag_group->'tags') AS tag
      WHERE tag = OLD.tag
  ));

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tag_trigger ON "tags";
CREATE TRIGGER update_tag_trigger
AFTER UPDATE OF "tag" ON "tags"
FOR EACH ROW EXECUTE FUNCTION update_tag_keys();

DROP TRIGGER IF EXISTS delete_tag_trigger ON "tags";
CREATE TRIGGER delete_tag_trigger
AFTER DELETE ON "tags" 
FOR EACH ROW EXECUTE FUNCTION delete_tag_keys();